#!/usr/bin/env node
// Checks the links from the built site to other sites, for the weekly link
// check (.github/workflows/links.yml).
//
//   node scripts/check-links.mjs [dist] [report.md]
//
// Reads every page in dist (but the reading page, whose links are articles
// shared as they were), checks each outside link once, and writes a Markdown
// report of the broken ones and the pages they're on. A link is broken when
// it answers 404 or 410, or a server error or no answer at all twice in a
// row. Sites that turn away checkers (401, 403, 429) can't be judged, so
// they're listed apart rather than called broken. Prints the number broken.

import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(process.argv[2] ?? 'dist');
const reportFile = process.argv[3] ?? 'links-report.md';
const OWN_HOSTS = new Set(['www.alilleybrinker.com', 'alilleybrinker.com']);
const SKIPPED_PAGES = [/^reading\//];
const BROKEN = new Set([404, 410]);
const UNJUDGED = new Set([401, 403, 429, 999]);

async function pages(directory) {
  const found = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await pages(full));
    else if (entry.name.endsWith('.html')) found.push(full);
  }
  return found;
}

const decode = (href) => href.replace(/&amp;/g, '&').replace(/&#38;/g, '&');

// Every outside link, with the pages that use it.
const links = new Map();
for (const file of await pages(root)) {
  const page = `/${path.relative(root, file).replace(/index\.html$/, '')}`;
  if (SKIPPED_PAGES.some((pattern) => pattern.test(page.slice(1)))) continue;
  const html = await readFile(file, 'utf8');
  for (const [, raw] of html.matchAll(/<a\b[^>]*\bhref="(https?:\/\/[^"]+)"/g)) {
    const href = decode(raw);
    let url;
    try {
      url = new URL(href);
    } catch {
      continue;
    }
    if (OWN_HOSTS.has(url.hostname)) continue;
    url.hash = '';
    const key = url.href;
    if (!links.has(key)) links.set(key, new Set());
    links.get(key).add(page);
  }
}

async function request(url, method) {
  const response = await fetch(url, {
    method,
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
    headers: { 'user-agent': 'Mozilla/5.0 (link check for www.alilleybrinker.com)', accept: 'text/html,*/*' },
  });
  await response.body?.cancel();
  return response.status;
}

// One try: HEAD, then GET for servers that don't answer HEAD properly.
async function attempt(url) {
  try {
    const status = await request(url, 'HEAD');
    if (status < 400) return status;
    return await request(url, 'GET');
  } catch (error) {
    if (error?.name === 'TimeoutError') return 'timed out';
    return error?.cause?.code ?? error?.cause?.errors?.[0]?.code ?? 'no answer';
  }
}

async function check(url) {
  let result = await attempt(url);
  // A server error or no answer may pass; only twice in a row counts.
  if (typeof result !== 'number' || result >= 500) {
    await new Promise((resolve) => setTimeout(resolve, 5_000));
    result = await attempt(url);
  }
  if (typeof result === 'number' && result < 400) return { state: 'ok', result };
  if (typeof result === 'number' && UNJUDGED.has(result)) return { state: 'unjudged', result };
  return { state: 'broken', result };
}

const results = new Map();
const queue = [...links.keys()];
await Promise.all(Array.from({ length: 8 }, async () => {
  while (queue.length) {
    const url = queue.shift();
    results.set(url, await check(url));
  }
}));

const list = (state) => [...results].filter(([, outcome]) => outcome.state === state).sort(([a], [b]) => a.localeCompare(b));
const broken = list('broken');
const unjudged = list('unjudged');
const lines = [
  `Checked ${links.size} links to other sites from the built site (not the reading page).`,
  '',
];
if (broken.length) {
  lines.push(`## Broken (${broken.length})`, '');
  for (const [url, { result }] of broken) lines.push(`- ${url} (${result}), on ${[...links.get(url)].sort().map((page) => `\`${page}\``).join(', ')}`);
  lines.push('');
} else {
  lines.push('No broken links.', '');
}
if (unjudged.length) {
  lines.push(`<details><summary>Couldn't be checked (${unjudged.length}): these sites turn away checkers</summary>`, '');
  for (const [url, { result }] of unjudged) lines.push(`- ${url} (${result})`);
  lines.push('', '</details>', '');
}
await writeFile(reportFile, lines.join('\n'));
console.log(broken.length);
