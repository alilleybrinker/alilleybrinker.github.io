import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { byNewest, postDate, postPath, topicSlug } from '../../../lib/site';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  const topics = [...new Set(posts.flatMap((post) => post.data.taxonomies.topics))];
  return topics.map((topic) => ({ params: { topic: topicSlug(topic) }, props: { topic, posts: posts.filter((post) => post.data.taxonomies.topics.includes(topic)).sort(byNewest) } }));
}

export async function GET(context: { props: { topic: string; posts: Awaited<ReturnType<typeof getCollection>> } ; site?: URL }) {
  const { topic, posts } = context.props;
  return rss({ title: `Andrew Lilley Brinker — ${topic}`, description: `Posts about ${topic}`, site: context.site, items: posts.map((post) => ({ title: post.data.title, description: post.data.description, link: postPath(post), pubDate: postDate(post) })) });
}
