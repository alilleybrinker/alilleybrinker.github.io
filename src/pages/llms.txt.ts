import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { markdownPath } from '../lib/markdown';
import { byNewest, isListedPost, postDate } from '../lib/site';

export const GET: APIRoute = async ({ site }) => {
  const posts = (await getCollection('blog')).filter(isListedPost).sort(byNewest);
  const url = (path: string) => new URL(path, site).href;
  const entry = (post: (typeof posts)[number]) => {
    const href = post.data.externalUrl ?? url(markdownPath(post));
    const where = post.data.publicationTitle ? `, in ${post.data.publicationTitle}` : '';
    const description = post.data.description ? `: ${post.data.description.replace(/\s+/g, ' ')}` : '';
    return `- [${post.data.title}](${href}) (${postDate(post).toISOString().slice(0, 10)}${where})${description}`;
  };
  const body = `# Andrew Lilley Brinker

> Andrew Lilley Brinker is a Member of Technical Staff at Anthropic. He writes about software security, memory safety, Rust, and open source.

Every post on this site is available as Markdown by replacing its trailing slash with \`.md\` (for example, ${url('/blog/cpp-must-become-safer.md')}). The words on this site were written by Andrew; see the AI policy at ${url('/ai/')}. Everything here is his own view, not his employer's.

## Posts

${posts.map(entry).join('\n')}

## Optional

- [About](${url('/about/')}): Background, talks, and the AI policy.
- [Projects](${url('/projects/')}): Open source projects.
- [Full text of all posts](${url('/llms-full.txt')})
- [Atom feed](${url('/atom.xml')})
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
