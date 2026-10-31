import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { byNewest, isListedPost, postDate, postPath } from '../lib/site';

// The site's old RSS feed, kept for those already subscribed to it. It isn't
// listed anywhere: the site's feeds are Atom (atom.xml.ts).
export async function GET(context: { site?: URL }) {
  const posts = (await getCollection('blog')).filter(isListedPost).sort(byNewest);
  return rss({ title: 'Andrew Lilley Brinker', description: 'Posts by Andrew Lilley Brinker', site: context.site!, items: posts.map((post) => ({ title: post.data.title, description: post.data.description, link: post.data.externalUrl ?? postPath(post), pubDate: postDate(post) })) });
}
