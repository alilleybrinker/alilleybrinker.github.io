import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { atomFeed, postEntry } from '../lib/atom';
import { byNewest, isListedPost } from '../lib/site';

// Every listed post, in full: the site's main feed.
export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('blog')).filter(isListedPost).sort(byNewest);
  return atomFeed({ title: 'Andrew Lilley Brinker', subtitle: 'Posts by Andrew Lilley Brinker', path: '/atom.xml', alternate: '/', site: site!, entries: posts.map((post) => postEntry(post, site!)) });
};
