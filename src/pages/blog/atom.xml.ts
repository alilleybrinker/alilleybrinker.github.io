import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { atomFeed, postEntry } from '../../lib/atom';
import { byNewest, isListedPost } from '../../lib/site';

// The old blog feed's address, kept for those subscribed to it: the same as
// the main feed (atom.xml.ts).
export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('blog')).filter(isListedPost).sort(byNewest);
  return atomFeed({ title: 'Andrew Lilley Brinker', subtitle: 'Posts by Andrew Lilley Brinker', path: '/blog/atom.xml', alternate: '/', site: site!, entries: posts.map((post) => postEntry(post, site!)) });
};
