import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { talkPath, talks } from '../lib/talks';
import { byNewest, isListedPost, postDate, postPath, postUpdated, topicSlug } from '../lib/site';

// Every page worth finding, for search engines: the top-level pages, each
// listed post, each topic and each talk. Redirects (/blog/, /topics/, /mini/, /name/)
// and unlisted posts are left out. A post's date is when it was last
// updated, else published; the home page and topics take their newest post's.
export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('blog')).filter(isListedPost).sort(byNewest);
  const day = (date: Date) => date.toISOString().slice(0, 10);
  const changed = (post: (typeof posts)[number]) => postUpdated(post) ?? postDate(post);
  const newest = (group: typeof posts) => day(new Date(Math.max(...group.map((post) => changed(post).valueOf()))));
  const topics = [...new Set(posts.flatMap((post) => post.data.taxonomies.topics))];
  const pages: [string, string?][] = [
    ['/', newest(posts)],
    ['/about/'],
    ['/reading/'],
    ['/projects/'],
    ['/talks/'],
    ['/colophon/'],
    ['/ai/'],
    ['/topics/', newest(posts)],
    ...posts.filter((post) => !post.data.externalUrl).map((post): [string, string] => [postPath(post), day(changed(post))]),
    ...talks.map((talk): [string] => [talkPath(talk)]),
    ...topics.map((topic): [string, string] => [`/topics/${topicSlug(topic)}/`, newest(posts.filter((post) => post.data.taxonomies.topics.includes(topic)))]),
  ];
  const urls = pages.map(([path, lastmod]) => `  <url><loc>${new URL(path, site).href}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`);
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`, { headers: { 'Content-Type': 'application/xml' } });
};
