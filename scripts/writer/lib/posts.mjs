// Reading and writing the `blog` content collection. Everything here works on
// the same Markdown files the Astro dev server watches, so a save is what makes
// the preview update — there is no separate draft store.

import { readdir, readFile, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { parseFrontmatter, stringifyPost, FrontmatterError } from './frontmatter.mjs';

export const ROOT = path.resolve(import.meta.dirname, '../../..');
export const BLOG_DIR = path.join(ROOT, 'content/blog');

// Mirrors the collection loader in src/content.config.ts, which globs
// `[0-9]*.md`, plus the date prefix that src/lib/site.ts requires.
const ID_PATTERN = /^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const WORDS_PER_MINUTE = 200;

export class WriterError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function isPostId(id) {
  return typeof id === 'string' && ID_PATTERN.test(id);
}

export function postPath(id) {
  if (!isPostId(id)) throw new WriterError(`"${id}" is not a valid post file name (expected YYYY-MM-DD-slug.md).`);
  const resolved = path.join(BLOG_DIR, id);
  if (path.dirname(resolved) !== BLOG_DIR) throw new WriterError('Post path escapes the blog directory.', 403);
  return resolved;
}

export function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'"“”]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function makeId(date, slug) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date ?? '')) throw new WriterError(`"${date}" is not a valid date (expected YYYY-MM-DD).`);
  const clean = slugify(slug);
  if (!clean) throw new WriterError('A post needs a slug (it is derived from the title if you leave it blank).');
  return `${date}-${clean}.md`;
}

export function splitId(id) {
  const match = id.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  if (!match) throw new WriterError(`"${id}" is not a valid post file name.`);
  return { date: match[1], slug: match[2] };
}

export function countWords(body) {
  return body.match(/\S+/g)?.length ?? 0;
}

export function readingTimeFor(data, body) {
  if (data.readingTime) return data.readingTime;
  return Math.max(1, Math.ceil(countWords(body) / WORDS_PER_MINUTE));
}

export function postUrl(id, data) {
  if (data?.externalUrl) return data.externalUrl;
  return `/blog/${splitId(id).slug}/`;
}

function summarize(id, raw, stats) {
  const base = { id, ...splitId(id), mtimeMs: Math.floor(stats.mtimeMs), bytes: stats.size };
  try {
    const { data, body } = parseFrontmatter(raw);
    return {
      ...base,
      title: typeof data.title === 'string' ? data.title : '(untitled)',
      description: typeof data.description === 'string' ? data.description : '',
      unlisted: data.unlisted === true,
      externalUrl: typeof data.externalUrl === 'string' ? data.externalUrl : null,
      topics: Array.isArray(data.taxonomies?.topics) ? data.taxonomies.topics : [],
      types: Array.isArray(data.taxonomies?.type) ? data.taxonomies.type : [],
      toc: data.extra?.toc === true,
      words: countWords(body),
      readingTime: readingTimeFor(data, body),
      url: postUrl(id, data),
      readable: true,
    };
  } catch (error) {
    return { ...base, title: id, description: '', unlisted: false, externalUrl: null, topics: [], types: [], toc: false, words: 0, readingTime: 1, url: postUrl(id, {}), readable: false, error: error.message };
  }
}

export async function listPosts() {
  const names = (await readdir(BLOG_DIR)).filter((name) => isPostId(name)).sort().reverse();
  const posts = await Promise.all(names.map(async (name) => {
    const file = path.join(BLOG_DIR, name);
    const [raw, stats] = await Promise.all([readFile(file, 'utf8'), stat(file)]);
    return summarize(name, raw, stats);
  }));
  return posts;
}

export async function readPost(id) {
  const file = postPath(id);
  let raw;
  let stats;
  try {
    [raw, stats] = await Promise.all([readFile(file, 'utf8'), stat(file)]);
  } catch (error) {
    if (error.code === 'ENOENT') throw new WriterError(`No post named "${id}".`, 404);
    throw error;
  }
  const post = { id, ...splitId(id), raw, mtimeMs: Math.floor(stats.mtimeMs) };
  try {
    const { data, body } = parseFrontmatter(raw);
    return { ...post, data, body, url: postUrl(id, data), words: countWords(body), readingTime: readingTimeFor(data, body), structured: true };
  } catch (error) {
    if (!(error instanceof FrontmatterError)) throw error;
    // The front matter uses YAML this editor cannot round-trip safely, so the
    // client edits the file as raw text instead of through the form.
    return { ...post, data: {}, body: raw, url: null, words: countWords(raw), readingTime: 1, structured: false, error: error.message };
  }
}

// Writes through a sibling temp file so the dev server never reads a partial post.
async function writeAtomic(file, contents) {
  const temp = `${file}.writer-${process.pid}-${Date.now()}.tmp`;
  try {
    await writeFile(temp, contents, 'utf8');
    await rename(temp, file);
  } catch (error) {
    await unlink(temp).catch(() => {});
    throw error;
  }
}

async function assertUnchanged(file, expectedMtimeMs) {
  if (expectedMtimeMs === undefined || expectedMtimeMs === null) return;
  const stats = await stat(file).catch(() => null);
  if (!stats) return;
  if (Math.floor(stats.mtimeMs) > Number(expectedMtimeMs)) {
    throw new WriterError('This post changed on disk since you opened it. Reload it, or save again to overwrite.', 409);
  }
}

export async function savePost(id, { data, body, raw, targetId, expectedMtimeMs }) {
  const file = postPath(id);
  if (!existsSync(file)) throw new WriterError(`No post named "${id}".`, 404);
  await assertUnchanged(file, expectedMtimeMs);

  let contents;
  if (typeof raw === 'string') {
    contents = raw.endsWith('\n') ? raw : `${raw}\n`;
  } else {
    if (!data || typeof data !== 'object') throw new WriterError('Saving needs either front matter data or raw text.');
    const current = await readFile(file, 'utf8');
    let spans = [];
    try {
      spans = parseFrontmatter(current).spans;
    } catch {
      spans = [];
    }
    contents = stringifyPost(data, typeof body === 'string' ? body : '', spans);
  }

  const destination = targetId && targetId !== id ? postPath(targetId) : file;
  if (destination !== file && existsSync(destination)) {
    throw new WriterError(`"${targetId}" already exists.`, 409);
  }
  await writeAtomic(file, contents);
  if (destination !== file) await rename(file, destination);
  const finalId = destination === file ? id : targetId;
  return readPost(finalId);
}

export async function createPost({ title, date, slug, description = '', topics = [], types = ['Blog'], toc = false, unlisted = true, body = '' }) {
  if (!title || !String(title).trim()) throw new WriterError('A new post needs a title.');
  const id = makeId(date, slug || title);
  const file = postPath(id);
  if (existsSync(file)) throw new WriterError(`"${id}" already exists.`, 409);
  const data = { title: String(title).trim() };
  if (description) data.description = String(description);
  if (unlisted) data.unlisted = true;
  data.taxonomies = { type: types, topics };
  if (toc) data.extra = { toc: true };
  await writeAtomic(file, stringifyPost(data, body));
  return readPost(id);
}

export async function deletePost(id) {
  const file = postPath(id);
  if (!existsSync(file)) throw new WriterError(`No post named "${id}".`, 404);
  await unlink(file);
  return { id };
}

export async function collectTopics() {
  const posts = await listPosts();
  const topics = new Map();
  const types = new Map();
  for (const post of posts) {
    for (const topic of post.topics) topics.set(topic, (topics.get(topic) ?? 0) + 1);
    for (const type of post.types) types.set(type, (types.get(type) ?? 0) + 1);
  }
  const sort = (map) => [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, count]) => ({ name, count }));
  return { topics: sort(topics), types: sort(types) };
}

// Mirrors the zod schema in src/content.config.ts, plus the softer house rules
// the schema cannot express. Returned to the client as a live checklist.
export function validatePost(id, data, body, otherIds = [], knownTopics = []) {
  const problems = [];
  const warn = (level, message) => problems.push({ level, message });

  if (typeof data.title !== 'string' || data.title.trim() === '') warn('error', 'Front matter needs a title.');
  if (data.description !== undefined && typeof data.description !== 'string') warn('error', 'description must be text.');
  if (data.externalUrl !== undefined) {
    try {
      new URL(data.externalUrl);
    } catch {
      warn('error', 'externalUrl must be a full URL.');
    }
  }
  if (data.readingTime !== undefined && (!Number.isInteger(data.readingTime) || data.readingTime <= 0)) {
    warn('error', 'readingTime must be a positive whole number of minutes.');
  }
  if (data.unlisted !== undefined && typeof data.unlisted !== 'boolean') warn('error', 'unlisted must be true or false.');
  for (const key of ['type', 'topics']) {
    const value = data.taxonomies?.[key];
    if (value !== undefined && (!Array.isArray(value) || value.some((item) => typeof item !== 'string'))) {
      warn('error', `taxonomies.${key} must be a list of names.`);
    }
  }
  if (data.extra?.toc !== undefined && typeof data.extra.toc !== 'boolean') warn('error', 'extra.toc must be true or false.');

  if (!data.description) warn('warn', 'No description: the post will have no summary, meta description, or feed blurb.');
  else if (data.description.length > 200) warn('warn', `Description is ${data.description.length} characters; long ones get cut off in search results.`);
  if (!data.taxonomies?.topics?.length) warn('warn', 'No topics: the post will not appear on any topic page.');
  for (const topic of data.taxonomies?.topics ?? []) {
    if (!knownTopics.includes(topic)) warn('warn', `"${topic}" is a new topic — check the spelling and capitalization.`);
  }
  if (!data.taxonomies?.type?.length) warn('warn', 'No type: existing posts all use "Blog".');
  if (data.unlisted === true) warn('info', 'Unlisted: reachable by URL, but hidden from the home page, topic pages, and feeds.');
  if (!data.externalUrl && body.trim() === '') warn('warn', 'The post has no body yet.');
  if (/^# /m.test(body)) warn('warn', 'The body has a level-1 heading; the title is already rendered as the h1, so start sections at "##".');
  if (data.extra?.toc && !/^## /m.test(body)) warn('warn', 'Table of contents is on, but the body has no "##" headings to list.');
  if (id) {
    const { slug } = splitId(id);
    const duplicate = otherIds.filter((other) => other !== id).some((other) => splitId(other).slug === slug);
    if (duplicate) warn('error', `Another post already uses the slug "${slug}"; /blog/${slug}/ would collide.`);
  }
  return problems;
}
