import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { postMarkdown } from '../lib/markdown';
import { byNewest, isListedPost } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('blog'))
    .filter((post) => isListedPost(post) && !post.data.externalUrl)
    .sort(byNewest);
  const body = posts.map((post) => postMarkdown(post, site!)).join('\n---\n\n');
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
