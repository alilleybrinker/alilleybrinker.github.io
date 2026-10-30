import rss from '@astrojs/rss';
import { getReadingItems } from '../../lib/bluesky';

// The reading page as a feed: each article Andrew has shared on Bluesky, newest
// share first, with what he said about it.
// A note's text without its markup, for readers that show only a summary.
const plain = (html: string) => html
  .replace(/<[^>]+>/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

export async function GET(context: { site?: URL }) {
  const items = await getReadingItems();
  return rss({
    title: 'Andrew Lilley Brinker: Reading',
    description: 'Articles Andrew Lilley Brinker has shared on Bluesky.',
    site: context.site!,
    items: items.map((item) => {
      const shared = item.mentions[0];
      const notes = item.mentions.map((mention) => mention.noteHtml).filter(Boolean).join('');
      return {
        title: item.articleTitle,
        link: item.url,
        pubDate: new Date(shared.publishedAt),
        description: notes ? plain(notes) : item.rootDomain,
        content: `${notes}<p>${item.rootDomain} · <a href="${shared.blueskyUrl}">On Bluesky</a></p>`,
      };
    }),
  });
}
