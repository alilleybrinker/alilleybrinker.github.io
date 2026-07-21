import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'blog'> | CollectionEntry<'mini'>;

export function postDate(post: Post) {
  const match = post.id.match(/^(\d{4}-\d{2}-\d{2})-/);
  if (!match) throw new Error(`Post has no date prefix: ${post.id}`);
  return new Date(`${match[1]}T12:00:00Z`);
}

export function postSlug(post: Post) {
  return post.id.replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/\.md$/, '');
}

export function postPath(post: Post) {
  return `/${post.collection}/${postSlug(post)}/`;
}

export function byNewest(a: Post, b: Post) {
  return postDate(b).valueOf() - postDate(a).valueOf();
}

export function topicSlug(topic: string) {
  return topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
