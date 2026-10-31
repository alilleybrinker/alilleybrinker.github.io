import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { atomFeed, postEntry } from '../../lib/atom';
import { byNewest, isListedPost, legacyMiniSlugs, postSlug } from '../../lib/site';

// The old mini posts' feed, kept for those subscribed to it. It isn't listed.
export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('blog')).filter((post) => isListedPost(post) && legacyMiniSlugs.has(postSlug(post))).sort(byNewest);
  return atomFeed({ title: 'Andrew Lilley Brinker — Mini', subtitle: 'Posts by Andrew Lilley Brinker', path: '/mini/atom.xml', alternate: '/', site: site!, entries: posts.map((post) => postEntry(post, site!)) });
};
