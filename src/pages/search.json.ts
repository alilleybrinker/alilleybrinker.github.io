import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { talkPath, talks } from '../lib/talks';
import { byNewest, isListedPost, postDate, postPath, topicSlug } from '../lib/site';

// Powers the command palette (CommandPalette.astro): every listed post, topic
// top-level page and talk, small enough to fetch once and search in the browser.
export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog')).filter(isListedPost).sort(byNewest);
  const counts = new Map<string, number>();
  for (const topic of posts.flatMap((post) => post.data.taxonomies.topics)) counts.set(topic, (counts.get(topic) ?? 0) + 1);
  const index = {
    pages: [
      { title: 'Home', path: '/' },
      { title: 'About', path: '/about/' },
      { title: 'Reading', path: '/reading/' },
      { title: 'Projects', path: '/projects/' },
      { title: 'Talks', path: '/talks/' },
      { title: 'Topics', path: '/topics/' },
      { title: 'Colophon', path: '/colophon/' },
      { title: 'AI Policy', path: '/ai/' },
      ...talks.map((talk) => ({ title: talk.title, path: talkPath(talk) })),
    ],
    posts: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description?.replace(/\s+/g, ' '),
      topics: post.data.taxonomies.topics,
      year: postDate(post).getUTCFullYear(),
      path: postPath(post),
      external: Boolean(post.data.externalUrl),
    })),
    topics: [...counts].sort(([, a], [, b]) => b - a).map(([name, count]) => ({ name, count, path: `/topics/${topicSlug(name)}/` })),
  };
  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json' } });
};
