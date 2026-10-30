#!/usr/bin/env node
// Creates a post from a draft and checks it, with the writer's own rules, for
// publishing without the writing UI (see .claude/skills/publish-post).
//
//   node scripts/writer/new-post.mjs spec.json
//
// spec.json holds { title, date, slug?, description, topics, toc?, bodyFile }.
// The body is read from bodyFile, so a draft never has to be quoted on the
// command line. The post is created listed. Prints the new file's name and
// the checklist the writing UI would show, and exits non-zero on any error.

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { collectTopics, createPost, listPosts, validatePost } from './lib/posts.mjs';

const specFile = process.argv[2];
if (!specFile) {
  console.error('Usage: node scripts/writer/new-post.mjs spec.json');
  process.exit(2);
}

const spec = JSON.parse(await readFile(specFile, 'utf8'));
// A description is the author's own words; the post can't be made without one.
if (typeof spec.description !== 'string' || !spec.description.trim()) {
  console.error('The spec has no description. Ask the author for one; never write it.');
  process.exit(1);
}
const body = await readFile(path.resolve(path.dirname(specFile), spec.bodyFile), 'utf8');
const known = (await collectTopics()).topics.map((topic) => topic.name);

const post = await createPost({
  title: spec.title,
  date: spec.date,
  slug: spec.slug,
  description: spec.description.trim(),
  topics: spec.topics ?? [],
  toc: Boolean(spec.toc),
  unlisted: false,
  body: body.replace(/^\s+/, ''),
});

const others = (await listPosts()).map((other) => other.id);
const problems = validatePost(post.id, post.data, post.body, others, known);
console.log(post.id);
for (const { level, message } of problems) console.log(`${level}: ${message}`);
if (problems.some((problem) => problem.level === 'error')) process.exitCode = 1;
