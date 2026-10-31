// Atom feeds (RFC 4287), for every feed the site lists: all posts, each
// topic's, and the reading list. Posts carry their full text, with the site's
// own links made absolute so they work in a reader.
import type { Post } from './site';
import { postDate, postPath, postUpdated } from './site';

export interface AtomEntry {
  title: string;
  url: string;
  // A stable id for the entry: its URL, which never changes once published.
  id?: string;
  published: Date;
  updated?: Date;
  summary?: string;
  html?: string;
}

const AUTHOR = 'Andrew Lilley Brinker';

const escape = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// A post's HTML for a reader: root-relative links and images made absolute,
// and the empty "#" links beside headings, which only the site shows, left out.
export function absoluteHtml(html: string, site: URL) {
  return html.replace(/<a class="heading-link"[^>]*><\/a>/g, '').replace(/\s(href|src)="(\/[^"]*)"/g, (_, attribute: string, path: string) => ` ${attribute}="${new URL(path, site).href}"`);
}

export function atomFeed({ title, subtitle, path, alternate, site, entries }: {
  title: string;
  subtitle?: string;
  // Where this feed is served, and the page it follows.
  path: string;
  alternate: string;
  site: URL;
  entries: AtomEntry[];
}) {
  const self = new URL(path, site).href;
  const updated = new Date(Math.max(0, ...entries.map((entry) => (entry.updated ?? entry.published).valueOf())));
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escape(title)}</title>
${subtitle ? `  <subtitle>${escape(subtitle)}</subtitle>\n` : ''}  <id>${escape(self)}</id>
  <link rel="self" type="application/atom+xml" href="${escape(self)}"/>
  <link rel="alternate" type="text/html" href="${escape(new URL(alternate, site).href)}"/>
  <updated>${updated.toISOString()}</updated>
  <author><name>${AUTHOR}</name><uri>${escape(site.href)}</uri></author>
${entries.map((entry) => `  <entry>
    <title>${escape(entry.title)}</title>
    <id>${escape(entry.id ?? entry.url)}</id>
    <link rel="alternate" type="text/html" href="${escape(entry.url)}"/>
    <published>${entry.published.toISOString()}</published>
    <updated>${(entry.updated ?? entry.published).toISOString()}</updated>
${entry.summary ? `    <summary>${escape(entry.summary)}</summary>\n` : ''}${entry.html ? `    <content type="html" xml:base="${escape(entry.url)}">${escape(entry.html)}</content>\n` : ''}  </entry>`).join('\n')}
</feed>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' } });
}

// A post as an entry: its description as the summary and its full text as
// the content. A post published elsewhere links there, with no text of its own.
export function postEntry(post: Post, site: URL): AtomEntry {
  const url = post.data.externalUrl ?? new URL(postPath(post), site).href;
  const html = !post.data.externalUrl && post.rendered?.html ? absoluteHtml(post.rendered.html, site) : undefined;
  return {
    title: post.data.title,
    url,
    id: new URL(postPath(post), site).href,
    published: postDate(post),
    updated: postUpdated(post),
    summary: post.data.description,
    html,
  };
}
