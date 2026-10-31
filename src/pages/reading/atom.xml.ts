import type { APIRoute } from 'astro';
import { atomFeed } from '../../lib/atom';
import { getReadingItems } from '../../lib/bluesky';

// The reading page as a feed: each article Andrew has shared on Bluesky, newest
// share first, with what he said about it.
export const GET: APIRoute = async ({ site }) => {
  const items = await getReadingItems();
  return atomFeed({
    title: 'Andrew Lilley Brinker: Reading',
    subtitle: 'Articles Andrew Lilley Brinker has shared on Bluesky.',
    path: '/reading/atom.xml',
    alternate: '/reading/',
    site: site!,
    entries: items.map((item) => {
      const shared = item.mentions[0];
      const notes = item.mentions.map((mention) => mention.noteHtml).filter(Boolean).join('');
      return {
        title: item.articleTitle,
        url: item.url,
        published: new Date(shared.publishedAt),
        html: `${notes}<p>${item.rootDomain} · <a href="${shared.blueskyUrl}">On Bluesky</a></p>`,
      };
    }),
  });
};
