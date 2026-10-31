import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { atomFeed, postEntry } from '../../../lib/atom';
import { byNewest, isListedPost, topicSlug, type Post } from '../../../lib/site';

export async function getStaticPaths() {
  const posts = (await getCollection('blog')).filter(isListedPost);
  const topics = [...new Set(posts.flatMap((post) => post.data.taxonomies.topics))];
  return topics.map((topic) => ({ params: { topic: topicSlug(topic) }, props: { topic, posts: posts.filter((post) => post.data.taxonomies.topics.includes(topic)).sort(byNewest) } }));
}

// Each topic's posts, in full.
export const GET: APIRoute = ({ props, site }) => {
  const { topic, posts } = props as { topic: string; posts: Post[] };
  const path = `/topics/${topicSlug(topic)}/`;
  return atomFeed({ title: `Andrew Lilley Brinker — ${topic}`, subtitle: `Posts about ${topic}`, path: `${path}atom.xml`, alternate: path, site: site!, entries: posts.map((post) => postEntry(post, site!)) });
};
