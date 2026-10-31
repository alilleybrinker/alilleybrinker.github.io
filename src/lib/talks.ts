import GithubSlugger from 'github-slugger';
import talksData from '../../content/talks/talks.json';
import type { Post } from './site';

export type Talk = (typeof talksData.talks)[number] & {
  video_link?: string;
  slides_link?: string;
  event_link?: string;
  talk_link?: string;
};

export function talkSlug(talk: Talk) {
  return new GithubSlugger().slug(talk.title);
}

export function talkPath(talk: Talk) {
  return `/talks/${talkSlug(talk)}/`;
}

export function talkDate(talk: Talk) {
  return new Date(`${talk.date}T12:00:00Z`);
}

// Newest first.
export const talks: Talk[] = [...talksData.talks].sort((a, b) => b.date.localeCompare(a.date));

// The recording's YouTube id, for the player that loads on request.
export function youtubeId(link?: string) {
  if (!link) return undefined;
  const url = new URL(link);
  if (url.hostname === 'youtu.be') return url.pathname.slice(1);
  return url.hostname.endsWith('youtube.com') ? url.searchParams.get('v') ?? undefined : undefined;
}

// Posts on what a talk was about: those whose words share the talk's
// rarer words, weighted as in search (term frequency by inverse document
// frequency) and evened out for length. Only strong matches count, so a talk
// on a subject the blog hasn't covered lists none.
const STOP = new Set('the a an and or of in to for on with how what its it is as by from at this that their be are can more may other into about'.split(' '));
const MIN_SCORE = 4.5;

const words = (text: string) => (text.toLowerCase().match(/[a-z][a-z-]{2,}/g) ?? []).filter((word) => !STOP.has(word));

export function relatedPosts(talk: Talk, posts: Post[], limit = 3) {
  const texts = posts.map((post) => words(`${post.data.title} ${post.data.description} ${post.data.taxonomies.topics.join(' ')} ${post.body ?? ''}`));
  const documentFrequency = new Map<string, number>();
  for (const text of texts) for (const word of new Set(text)) documentFrequency.set(word, (documentFrequency.get(word) ?? 0) + 1);
  const query = new Set(words(`${talk.title} ${talk.description}`));
  return posts
    .map((post, index) => {
      const counts = new Map<string, number>();
      for (const word of texts[index]) counts.set(word, (counts.get(word) ?? 0) + 1);
      let score = 0;
      for (const word of query) {
        const count = counts.get(word);
        if (count) score += Math.log(1 + count) * Math.log(posts.length / documentFrequency.get(word)!);
      }
      return { post, score: score / Math.sqrt(texts[index].length / 100 + 1) };
    })
    .filter(({ score }) => score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);
}
