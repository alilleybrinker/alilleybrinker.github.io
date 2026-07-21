import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'>;

export const legacyMiniSlugs = new Set([
  'safety-hygiene',
  'jujutsu-is-the-future',
  'the-best-monad-tutorial',
  'tracking-software-id-schemes',
  'memory-safety-for-skeptics-in-the-acm-queue',
  'gas-town-decoded',
  'passkey-prf-risks',
  'gas-town-and-urbit',
  'rusts-culture-of-semantic-precision',
  'move-over-gas-town',
]);

export function postDate(post: Post) {
  const match = post.id.match(/^(\d{4}-\d{2}-\d{2})-/);
  if (!match) throw new Error(`Post has no date prefix: ${post.id}`);
  return new Date(`${match[1]}T12:00:00Z`);
}

export function postSlug(post: Post) {
  return post.id.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
}

export function postPath(post: Post) {
  return `/blog/${postSlug(post)}/`;
}

export function postReadingTime(post: Post) {
  return Math.max(1, Math.ceil((post.body?.match(/\S+/g)?.length ?? 0) / 200));
}

export function readingTimeStrength(readingTime: number) {
  return Math.min((readingTime - 1) / 9, 1);
}

export function byNewest(a: Post, b: Post) {
  return postDate(b).valueOf() - postDate(a).valueOf();
}

export function topicSlug(topic: string) {
  return topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
