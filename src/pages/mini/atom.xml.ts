import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { byNewest, legacyMiniSlugs, postDate, postPath, postSlug } from '../../lib/site';

export async function GET(context: { site?: URL }) {
  const posts = (await getCollection('blog')).filter((post) => legacyMiniSlugs.has(postSlug(post))).sort(byNewest);
  return rss({ title: 'Andrew Lilley Brinker — Blog', description: 'Posts by Andrew Lilley Brinker', site: context.site, items: posts.map((post) => ({ title: post.data.title, description: post.data.description, link: postPath(post), pubDate: postDate(post) })) });
}
