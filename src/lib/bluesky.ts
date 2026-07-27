import { getDomain } from 'tldts';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const BLUESKY_HANDLE = 'alilleybrinker.com';
const AUTHOR_FEED_ENDPOINT = 'https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed';
const VIDEO_HOSTS = new Set([
  'dailymotion.com',
  'rumble.com',
  'streamable.com',
  'tiktok.com',
  'twitch.tv',
  'vimeo.com',
  'youtube.com',
  'youtu.be',
]);
const VIDEO_FILE_EXTENSION = /\.(?:avi|m4v|mkv|mov|mp4|webm)(?:$|[?#])/i;
const NON_ARTICLE_HOSTS = new Set([
  'alilleybrinker.com',
  'bsky.app',
  'crates.io',
  'doc.rust-lang.org',
  'docs.rs',
  'github.com',
  'gitlab.com',
  'news.ycombinator.com',
  'npmjs.com',
  'old.reddit.com',
  'play.rust-lang.org',
  'possiblerust.com',
  'pypi.org',
  'reddit.com',
  'stackoverflow.com',
]);
const ARTICLE_PATH = /\/(?:articles?|blog|essays?|library|news|posts?|read|writing|practice|patterns?)\//i;
const DATED_ARTICLE_PATH = /\/(?:19|20)\d{2}(?:[-/]\d{1,2})[-/]\d{1,2}(?:[-/]|$)/;
const NON_ARTICLE_PATH = /\/(?:about|account|api|archive|authors?|categories|docs?|issues|pricing|products?|search|tags?|topics?|tree|blob|commit|pull|releases?)\b/i;
const TITLE_OVERRIDES = new Map([
  ['https://htmx.org/essays/vendoring/', 'Vendoring'],
]);
const DEVELOPMENT_CACHE_TTL_MS = 60 * 60 * 1_000;
const DEVELOPMENT_CACHE_PATH = join(process.cwd(), '.astro', 'reading-items.json');
const DEVELOPMENT_CACHE_VERSION = 2;

interface LinkFacet {
  $type?: string;
  uri?: string;
}

interface Facet {
  features?: LinkFacet[];
  index: { byteEnd: number; byteStart: number };
}

interface FeedPost {
  uri: string;
  author: { handle: string };
  record: { createdAt: string; facets?: Facet[]; text: string };
}

interface AuthorFeedResponse {
  cursor?: string;
  feed: Array<{ post: FeedPost }>;
}

interface ReadingMention {
  blueskyUrl: string;
  publishedAt: string;
}

export interface ReadingItem {
  articlePublishedAt?: string;
  articleTitle: string;
  articleTitleHtml: string;
  mentions: ReadingMention[];
  rootDomain: string;
  url: string;
}

interface ReadingItemsCache {
  cachedAt: string;
  items: ReadingItem[];
  version: number;
}

let readingItemsInFlight: Promise<ReadingItem[]> | undefined;

async function readDevelopmentCache() {
  if (!import.meta.env.DEV) return undefined;

  try {
    const cache = JSON.parse(await readFile(DEVELOPMENT_CACHE_PATH, 'utf8')) as ReadingItemsCache;
    const age = Date.now() - new Date(cache.cachedAt).getTime();
    return cache.version === DEVELOPMENT_CACHE_VERSION
      && Array.isArray(cache.items) && age >= 0 && age < DEVELOPMENT_CACHE_TTL_MS
      ? cache.items
      : undefined;
  } catch {
    return undefined;
  }
}

async function writeDevelopmentCache(items: ReadingItem[]) {
  if (!import.meta.env.DEV) return;

  await mkdir(dirname(DEVELOPMENT_CACHE_PATH), { recursive: true });
  const temporaryPath = `${DEVELOPMENT_CACHE_PATH}.tmp`;
  await writeFile(temporaryPath, JSON.stringify({
    cachedAt: new Date().toISOString(),
    items,
    version: DEVELOPMENT_CACHE_VERSION,
  }), 'utf8');
  await rename(temporaryPath, DEVELOPMENT_CACHE_PATH);
}

function blueskyPostUrl(uri: string) {
  const rkey = uri.split('/').at(-1);
  if (!rkey) throw new Error(`Invalid Bluesky post URI: ${uri}`);
  return `https://bsky.app/profile/${BLUESKY_HANDLE}/post/${rkey}`;
}

function isVideoUrl(url: string) {
  const parsed = new URL(url);
  const hostname = parsed.hostname.replace(/^www\./, '');
  return VIDEO_FILE_EXTENSION.test(parsed.pathname)
    || [...VIDEO_HOSTS].some((host) => hostname === host || hostname.endsWith(`.${host}`));
}

function isLikelyArticleUrl(url: string) {
  const parsed = new URL(url);
  const hostname = parsed.hostname.replace(/^www\./, '');
  const isExcludedHost = [...NON_ARTICLE_HOSTS].some((host) => hostname === host || hostname.endsWith(`.${host}`));
  const isMemorySafetyForSkeptics = (hostname === 'cacm.acm.org' || hostname === 'queue.acm.org')
    && /memory-safety-for-skeptics/i.test(parsed.pathname);

  return !isExcludedHost
    && !isMemorySafetyForSkeptics
    && parsed.pathname !== '/'
    && !NON_ARTICLE_PATH.test(parsed.pathname)
    && (DATED_ARTICLE_PATH.test(parsed.pathname) || ARTICLE_PATH.test(parsed.pathname));
}

function stripSiteName(title: string) {
  return title.split(/\s+(?:\||—|–|•|·|-)\s+/)[0].trim() || title;
}

function formatArticleTitleHtml(title: string) {
  const escaped = title
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  return escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
}

function articleTitleFromUrl(url: string) {
  const segment = new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? url;
  const title = decodeURIComponent(segment)
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();
  return title ? `${title[0].toUpperCase()}${title.slice(1)}` : url;
}

function rootDomain(url: string) {
  return getDomain(url) ?? new URL(url).hostname.replace(/^www\./, '');
}

function withoutFragment(url: string) {
  const parsed = new URL(url);
  parsed.hash = '';
  return parsed.href;
}

function isVerificationNotice(title: string) {
  const normalized = title.toLowerCase();
  return normalized.includes('verification required') || normalized.includes('checking your browser');
}

function getLinkFacets(post: FeedPost) {
  return (post.record.facets ?? []).flatMap((facet) => {
    const link = facet.features?.find((feature) => feature.$type === 'app.bsky.richtext.facet#link');
    if (!link?.uri || !/^https?:\/\//.test(link.uri) || isVideoUrl(link.uri) || !isLikelyArticleUrl(link.uri)) return [];
    return [{ ...facet.index, url: withoutFragment(link.uri) }];
  }).sort((a, b) => a.byteStart - b.byteStart);
}

function htmlAttribute(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match?.[1] ?? match?.[2] ?? match?.[3];
}

function decodeHtml(value: string) {
  const namedEntities: Record<string, string> = {
    copy: '©',
    hellip: '…',
    laquo: '«',
    ldquo: '“',
    lsquo: '‘',
    mdash: '—',
    middot: '·',
    nbsp: ' ',
    ndash: '–',
    raquo: '»',
    rdquo: '”',
    reg: '®',
    rsquo: '’',
  };
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&([a-z]+);/gi, (entity, name: string) => namedEntities[name.toLowerCase()] ?? entity)
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code: string) => String.fromCodePoint(
      code.startsWith('x') ? Number.parseInt(code.slice(1), 16) : Number.parseInt(code, 10),
    ));
}

function metaContent(html: string, names: string[]) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const name = (htmlAttribute(tag, 'property') ?? htmlAttribute(tag, 'name'))?.toLowerCase();
    if (name && names.includes(name)) return htmlAttribute(tag, 'content');
  }
}

function metaRefreshUrl(html: string, baseUrl: string) {
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    if (htmlAttribute(tag, 'http-equiv')?.toLowerCase() !== 'refresh') continue;
    const content = htmlAttribute(tag, 'content');
    const target = content?.match(/(?:^|;)\s*url\s*=\s*['"]?(.+?)['"]?\s*$/i)?.[1];
    if (!target) continue;
    try {
      return new URL(decodeHtml(target), baseUrl).href;
    } catch {
      return undefined;
    }
  }
}

async function getArticleMetadataFromPage(url: string, remainingRedirects = 2): Promise<{ articlePublishedAt?: string; articleTitle?: string }> {
  try {
    const response = await fetch(url, {
      headers: { Accept: 'text/html,application/xhtml+xml' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) return {};

    const html = await response.text();
    const title = metaContent(html, ['og:title', 'twitter:title'])
      ?? html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1];
    const publishedAt = metaContent(html, ['article:published_time', 'og:published_time', 'date', 'dc.date']);
    if (title?.trim().toLowerCase() === 'redirect' && remainingRedirects > 0) {
      const target = metaRefreshUrl(html, response.url);
      if (target) return getArticleMetadataFromPage(target, remainingRedirects - 1);
    }
    return {
      articlePublishedAt: publishedAt,
      articleTitle: title ? stripSiteName(decodeHtml(title.replace(/<[^>]+>/g, '').trim())) : undefined,
    };
  } catch {
    return {};
  }
}

async function getArticleMetadataFromMicrolink(url: string) {
  try {
    const endpoint = new URL('https://api.microlink.io/');
    endpoint.searchParams.set('url', url);
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) return {};
    const result = await response.json() as { data?: { publishedTime?: string; title?: string } };
    return {
      articlePublishedAt: result.data?.publishedTime,
      articleTitle: result.data?.title ? stripSiteName(result.data.title) : undefined,
    };
  } catch {
    return {};
  }
}

async function getArticleMetadata(url: string) {
  const metadata = await getArticleMetadataFromPage(url);
  if (metadata.articleTitle) return metadata;
  return getArticleMetadataFromMicrolink(url);
}

async function withConcurrency<T, R>(items: T[], limit: number, work: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;
  const worker = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await work(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function loadReadingItems() {
  const items = new Map<string, ReadingItem>();
  let cursor: string | undefined;

  do {
    const url = new URL(AUTHOR_FEED_ENDPOINT);
    url.searchParams.set('actor', BLUESKY_HANDLE);
    url.searchParams.set('filter', 'posts_with_replies');
    url.searchParams.set('limit', '100');
    if (cursor) url.searchParams.set('cursor', cursor);

    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`Unable to load Bluesky feed: ${response.status}`);

    const data = await response.json() as AuthorFeedResponse;
    for (const { post } of data.feed) {
      if (post.author.handle !== BLUESKY_HANDLE) continue;
      const links = getLinkFacets(post);
      if (links.length === 0) continue;

      const mention = { blueskyUrl: blueskyPostUrl(post.uri), publishedAt: post.record.createdAt };
      for (const { url: articleUrl } of new Map(links.map((link) => [link.url, link])).values()) {
        const item = items.get(articleUrl) ?? {
          articleTitle: new URL(articleUrl).hostname,
          articleTitleHtml: new URL(articleUrl).hostname,
          mentions: [],
          rootDomain: rootDomain(articleUrl),
          url: articleUrl,
        };
        item.mentions.push(mention);
        items.set(articleUrl, item);
      }
    }
    cursor = data.cursor;
  } while (cursor);

  const readingItems = [...items.values()]
    .map((item) => ({
      ...item,
      mentions: item.mentions.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    }))
    .sort((a, b) => b.mentions[0].publishedAt.localeCompare(a.mentions[0].publishedAt));

  const enrichedItems = await withConcurrency(readingItems, 6, async (item) => {
    const metadata = await getArticleMetadata(item.url);
    const articleTitle = TITLE_OVERRIDES.get(item.url) ?? metadata.articleTitle ?? articleTitleFromUrl(item.url);
    return {
      ...item,
      articlePublishedAt: metadata.articlePublishedAt,
      articleTitle,
      articleTitleHtml: formatArticleTitleHtml(articleTitle),
    };
  });
  return enrichedItems.filter((item) => !isVerificationNotice(item.articleTitle));
}

export async function getReadingItems() {
  const cachedItems = await readDevelopmentCache();
  if (cachedItems) return cachedItems;

  if (!readingItemsInFlight) {
    readingItemsInFlight = loadReadingItems()
      .then(async (items) => {
        await writeDevelopmentCache(items);
        return items;
      })
      .finally(() => {
        readingItemsInFlight = undefined;
      });
  }
  return readingItemsInFlight;
}
