import { legacyRoute } from './remark-legacy-links';
import type { Post } from './site';
import { postDate, postPath, postReadingTime, postSlug, postUpdated } from './site';

export function markdownPath(post: Post) {
  return `/blog/${postSlug(post)}.md`;
}

// Rewrites the links a Markdown body uses on the site (legacy `@/` paths and
// root-relative paths) into absolute URLs, so the text stands on its own.
function absoluteLinks(body: string, site: URL) {
  const absolute = (url: string) => {
    const [path, hash] = url.split('#');
    const route = path.startsWith('@/') ? legacyRoute(path) : path.startsWith('/') ? path : undefined;
    return route ? `${new URL(route, site).href}${hash ? `#${hash}` : ''}` : url;
  };
  return body
    .replace(/\]\(([^)\s]+)/g, (_, url: string) => `](${absolute(url)}`)
    .replace(/^(\s*\[[^\]]+\]:\s*)(\S+)/gm, (_, label: string, url: string) => `${label}${absolute(url)}`);
}

export function postMarkdown(post: Post, site: URL) {
  const date = postDate(post).toISOString().slice(0, 10);
  const topics = post.data.taxonomies.topics;
  const meta = [
    `- Author: Andrew Lilley Brinker`,
    `- Published: ${date}`,
    postUpdated(post) && `- Updated: ${postUpdated(post)!.toISOString().slice(0, 10)}`,
    `- Reading time: ${postReadingTime(post)} minutes`,
    topics.length > 0 && `- Topics: ${topics.join(', ')}`,
    `- Canonical URL: ${new URL(postPath(post), site).href}`,
  ].filter(Boolean).join('\n');
  const description = post.data.description ? `> ${post.data.description.replace(/\s+/g, ' ')}\n\n` : '';
  return `# ${post.data.title}\n\n${description}${meta}\n\n${absoluteLinks(post.body ?? '', site).trim()}\n`;
}
