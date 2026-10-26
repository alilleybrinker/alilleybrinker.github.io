import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { isListedPost, postDate, postPath, postReadingTime } from '../../lib/site';

// Powers the hover previews of links to posts.
export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog')).filter((post) => isListedPost(post) && !post.data.externalUrl);
  const previews = Object.fromEntries(posts.map((post) => [postPath(post), {
    title: post.data.title,
    description: post.data.description?.replace(/\s+/g, ' '),
    date: postDate(post).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }),
    readingTime: postReadingTime(post),
    topics: post.data.taxonomies.topics,
  }]));
  return new Response(JSON.stringify(previews), { headers: { 'Content-Type': 'application/json' } });
};
