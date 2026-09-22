#!/usr/bin/env node
// A local writing UI for this site's blog collection.
//
//   npm run write            # starts the Astro dev server and the writer
//   npm run write -- --help  # options
//
// The editor saves straight to content/blog/*.md, so the Astro dev server picks
// each save up and the preview pane reloads itself. Nothing here is meant to be
// exposed beyond localhost.

import http from 'node:http';
import net from 'node:net';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { readFile, watch as watchDir } from 'node:fs/promises';
import { createReadStream, existsSync } from 'node:fs';
import {
  BLOG_DIR, ROOT, WriterError, collectTopics, createPost, isPostId, listPosts,
  makeId, readPost, savePost, splitId, validatePost,
} from './lib/posts.mjs';

const CLIENT_DIR = path.join(import.meta.dirname, 'client');
const CONTAINERS_FILE = path.join(import.meta.dirname, 'containers.json');
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };
const HELP = `Usage: npm run write -- [options]

  --port <n>       port for the writing UI (default 4444, or WRITER_PORT)
  --dev-port <n>   port for the Astro dev server (default 4321)
  --dev-url <url>  preview an already-running dev server instead of starting one
  --no-dev         do not start or expect an Astro dev server
  --no-open        do not open a browser
  --help           show this message
`;

function parseArgs(argv) {
  const options = {
    port: Number(process.env.WRITER_PORT ?? 4444),
    devPort: Number(process.env.WRITER_DEV_PORT ?? 4321),
    devUrl: process.env.WRITER_DEV_URL ?? null,
    startDev: true,
    open: true,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      const value = argv[index + 1];
      if (value === undefined) throw new WriterError(`${arg} needs a value.`);
      index += 1;
      return value;
    };
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--port') options.port = Number(next());
    else if (arg === '--dev-port') options.devPort = Number(next());
    else if (arg === '--dev-url') { options.devUrl = next(); options.startDev = false; }
    else if (arg === '--no-dev') { options.startDev = false; options.devUrl = null; }
    else if (arg === '--no-open') options.open = false;
    else throw new WriterError(`Unknown option "${arg}". Try --help.`);
  }
  if (!Number.isInteger(options.port) || options.port <= 0) throw new WriterError('--port must be a positive whole number.');
  if (!Number.isInteger(options.devPort) || options.devPort <= 0) throw new WriterError('--dev-port must be a positive whole number.');
  return options;
}

function isPortOpen(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host });
    const done = (result) => {
      socket.destroy();
      resolve(result);
    };
    socket.setTimeout(500);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

async function waitForPort(port, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortOpen(port)) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

function astroBin() {
  const astro = path.join(ROOT, 'node_modules/astro/bin/astro.mjs');
  return existsSync(astro) ? astro : null;
}

function startDevServer(devPort) {
  const astro = astroBin();
  if (!astro) {
    console.error('Could not find node_modules/astro — run "npm install" first, or pass --no-dev.');
    return null;
  }
  const child = spawn(process.execPath, [astro, 'dev', '--port', String(devPort)], { cwd: ROOT, stdio: 'inherit' });
  child.on('exit', (code, signal) => {
    if (signal || code === 0) return;
    console.error(`\nThe Astro dev server exited with code ${code}; the preview pane will be blank.`);
  });
  return child;
}

// Recent Astro versions daemonize `astro dev`, so the child we spawned has
// already exited and only `astro dev stop` will bring the server down. Older
// versions keep running in the foreground, so try both.
function stopDevServer(child) {
  const astro = astroBin();
  if (astro) spawnSync(process.execPath, [astro, 'dev', 'stop'], { cwd: ROOT, stdio: 'ignore', timeout: 10_000 });
  if (child && child.exitCode === null) child.kill('SIGTERM');
}

function openBrowser(url) {
  const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
  const child = spawn(process.platform === 'win32' ? 'cmd' : command, args, { stdio: 'ignore', detached: true });
  child.on('error', () => {});
  child.unref();
}

function sendJson(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'content-length': Buffer.byteLength(body) });
  response.end(body);
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 5_000_000) throw new WriterError('Request body is too large.', 413);
    chunks.push(chunk);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new WriterError('Request body is not valid JSON.');
  }
}

// The UI is local, but a page in another tab could still post to it, so mutating
// requests must come from our own origin and carry a header that forces a
// CORS preflight browsers will not send cross-origin.
function assertSameOrigin(request, port) {
  if (request.headers['x-writer-app'] !== '1') throw new WriterError('Missing writer request header.', 403);
  const origin = request.headers.origin;
  if (!origin) return;
  const allowed = new Set([`http://localhost:${port}`, `http://127.0.0.1:${port}`, `http://[::1]:${port}`]);
  if (!allowed.has(origin)) throw new WriterError(`Requests from ${origin} are not allowed.`, 403);
}

async function serveStatic(response, urlPath) {
  const relative = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const file = path.join(CLIENT_DIR, relative);
  if (!file.startsWith(CLIENT_DIR + path.sep) || !existsSync(file)) {
    sendJson(response, 404, { error: 'Not found.' });
    return;
  }
  response.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
  createReadStream(file).pipe(response);
}

const clients = new Set();

function broadcast(event) {
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const client of clients) client.write(payload);
}

// Reports edits made outside the UI (an editor, a git checkout) so the client can
// offer to reload rather than overwrite them.
async function watchPosts(signal) {
  try {
    const watcher = watchDir(BLOG_DIR, { signal });
    const pending = new Map();
    for await (const event of watcher) {
      if (!event.filename || !isPostId(event.filename)) continue;
      const id = event.filename;
      clearTimeout(pending.get(id));
      pending.set(id, setTimeout(() => {
        pending.delete(id);
        broadcast({ type: 'file-changed', id, exists: existsSync(path.join(BLOG_DIR, id)) });
      }, 150));
    }
  } catch (error) {
    if (error.name !== 'AbortError') console.error(`Stopped watching content/blog: ${error.message}`);
  }
}

async function handleApi(request, response, url, options) {
  const route = url.pathname.replace(/^\/api/, '');

  if (route === '/events' && request.method === 'GET') {
    response.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-store', connection: 'keep-alive' });
    response.write(': connected\n\n');
    clients.add(response);
    const heartbeat = setInterval(() => response.write(': ping\n\n'), 25_000);
    request.on('close', () => {
      clearInterval(heartbeat);
      clients.delete(response);
    });
    return;
  }

  if (route === '/config' && request.method === 'GET') {
    const [{ topics, types }, containers] = await Promise.all([collectTopics(), readFile(CONTAINERS_FILE, 'utf8')]);
    sendJson(response, 200, {
      devUrl: options.devUrl,
      contentDir: path.relative(ROOT, BLOG_DIR),
      topics,
      types,
      ...JSON.parse(containers),
      today: new Date().toLocaleDateString('en-CA'),
    });
    return;
  }

  // The preview iframe is cross-origin, so the client cannot tell whether the
  // dev server is serving a page yet. This asks on its behalf — a post created
  // a moment ago is briefly a 404 while Astro picks the new file up.
  if (route === '/preview-status' && request.method === 'GET') {
    const target = url.searchParams.get('path') ?? '/';
    if (!options.devUrl || !target.startsWith('/')) {
      sendJson(response, 200, { ready: false, status: 0 });
      return;
    }
    try {
      const probe = await fetch(new URL(target, options.devUrl), { signal: AbortSignal.timeout(4_000) });
      sendJson(response, 200, { ready: probe.ok, status: probe.status });
    } catch {
      sendJson(response, 200, { ready: false, status: 0 });
    }
    return;
  }

  if (route === '/posts' && request.method === 'GET') {
    sendJson(response, 200, { posts: await listPosts() });
    return;
  }

  if (route === '/posts' && request.method === 'POST') {
    assertSameOrigin(request, options.port);
    const payload = await readJsonBody(request);
    const post = await createPost(payload);
    broadcast({ type: 'post-created', id: post.id });
    sendJson(response, 201, await withValidation(post));
    return;
  }

  if (route === '/validate' && request.method === 'POST') {
    assertSameOrigin(request, options.port);
    const { id, data, body } = await readJsonBody(request);
    const posts = await listPosts();
    sendJson(response, 200, { problems: validatePost(id ?? null, data ?? {}, body ?? '', posts.map((post) => post.id), topicsExcluding(posts, id)) });
    return;
  }

  const postMatch = route.match(/^\/posts\/([^/]+)$/);
  if (postMatch) {
    const id = decodeURIComponent(postMatch[1]);
    if (request.method === 'GET') {
      sendJson(response, 200, await withValidation(await readPost(id)));
      return;
    }
    if (request.method === 'PUT') {
      assertSameOrigin(request, options.port);
      const payload = await readJsonBody(request);
      let targetId = payload.targetId;
      if (!targetId && (payload.date || payload.slug)) {
        const current = splitId(id);
        targetId = makeId(payload.date ?? current.date, payload.slug ?? current.slug);
      }
      const post = await savePost(id, { ...payload, targetId });
      broadcast({ type: 'post-saved', id: post.id, previousId: id, mtimeMs: post.mtimeMs });
      sendJson(response, 200, await withValidation(post));
      return;
    }
  }

  sendJson(response, 404, { error: `No route for ${request.method} ${url.pathname}.` });
}

async function withValidation(post) {
  if (!post.structured) return { post, problems: [{ level: 'error', message: `Front matter could not be parsed (${post.error}); editing raw text instead.` }] };
  const posts = await listPosts();
  return { post, problems: validatePost(post.id, post.data, post.body, posts.map((entry) => entry.id), topicsExcluding(posts, post.id)) };
}

// Topics used by the *other* posts, so a post's own new topic still reads as new.
function topicsExcluding(posts, id) {
  return [...new Set(posts.filter((post) => post.id !== id).flatMap((post) => post.topics))];
}

async function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
  if (options.help) {
    process.stdout.write(HELP);
    return;
  }

  let devChild = null;
  let startedDev = false;
  if (options.startDev) {
    if (await isPortOpen(options.devPort)) {
      console.log(`Reusing the dev server already listening on port ${options.devPort}.`);
    } else {
      devChild = startDevServer(options.devPort);
      startedDev = devChild !== null;
    }
    options.devUrl = `http://localhost:${options.devPort}`;
  }

  const controller = new AbortController();
  watchPosts(controller.signal);

  const server = http.createServer((request, response) => {
    const url = new URL(request.url, `http://localhost:${options.port}`);
    const handle = url.pathname.startsWith('/api/')
      ? handleApi(request, response, url, options)
      : serveStatic(response, url.pathname);
    Promise.resolve(handle).catch((error) => {
      if (response.headersSent) {
        response.end();
        return;
      }
      const status = error instanceof WriterError ? error.status : 500;
      if (status >= 500) console.error(error);
      sendJson(response, status, { error: error.message });
    });
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${options.port} is already in use. Try: npm run write -- --port ${options.port + 1}`);
      process.exit(1);
    }
    throw error;
  });

  await new Promise((resolve) => server.listen(options.port, '127.0.0.1', resolve));
  const writerUrl = `http://localhost:${options.port}`;
  console.log(`\nWriting UI:  ${writerUrl}`);
  console.log(`Preview:     ${options.devUrl ?? '(none — started with --no-dev)'}`);
  console.log(`Editing:     ${path.relative(ROOT, BLOG_DIR)}/\n`);

  if (options.devUrl && options.startDev) await waitForPort(options.devPort);
  if (options.open) openBrowser(writerUrl);

  let stopping = false;
  const shutdown = () => {
    if (stopping) return;
    stopping = true;
    controller.abort();
    for (const client of clients) client.end();
    server.close();
    // Only stop a dev server this process started; one that was already
    // running belongs to whoever started it.
    if (startedDev) {
      console.log('\nStopping the Astro dev server…');
      stopDevServer(devChild);
    }
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main();
