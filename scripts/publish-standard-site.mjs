import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const siteUrl = 'https://www.alilleybrinker.com';
const collection = 'site.standard.document';
const publicationCollection = 'site.standard.publication';
const postsDirectory = new URL('../content/blog/', import.meta.url);
const metadataFile = new URL('../src/data/standard-site.json', import.meta.url);
const verificationFile = new URL('../public/.well-known/site.standard.publication', import.meta.url);
const publicationIconFile = new URL('../public/favicon-face.png', import.meta.url);

async function loadDotenv() {
  try {
    const dotenv = await readFile(new URL('../.env', import.meta.url), 'utf8');
    for (const line of dotenv.split('\n')) {
      const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

// Standard.site's records are keyed by TIDs: a timestamp in microseconds and
// a 10-bit clock ID, in a sortable base32. Each record's TID is made from a
// fixed time and its own name, so a post keeps the same record from one run to
// the next and each run replaces it in place, with nothing to remember between
// runs.
const TID_ALPHABET = '234567abcdefghijklmnopqrstuvwxyz';

export function tid(isoTime, name) {
  const hash = createHash('sha256').update(name).digest();
  // The name also picks the microsecond, so posts from the same day differ.
  const micros = BigInt(Date.parse(isoTime)) * 1000n + BigInt(hash.readUInt32BE(0) % 1_000_000);
  let value = (micros << 10n) | BigInt(hash.readUInt16BE(4) & 0x3ff);
  let text = '';
  for (let i = 0; i < 13; i++) {
    text = TID_ALPHABET[Number(value & 31n)] + text;
    value >>= 5n;
  }
  return text;
}

export const publicationRkey = tid('2026-10-27T00:00:00.000Z', 'publication');
export const documentRkey = (post) => tid(post.publishedAt, post.slug);

// The keys records had before Standard.site required TIDs. Their records are
// deleted as the new ones are written; once gone, deleting them does nothing.
const legacyPublicationRkey = 'alilleybrinker-site';
const legacyDocumentRkey = (post) => `blog-${post.slug}`;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set.`);
  return value;
}

function frontmatter(source, filename) {
  const match = source.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error(`${filename} has no YAML frontmatter.`);

  const title = match[1].match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1];
  const descriptionBlock = match[1].match(/^description:\s*([\s\S]*?)(?=^[a-z][\w-]*:|$)/m)?.[1];
  const description = descriptionBlock
    ?.trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\n\s*/g, ' ');
  const topicsBlock = match[1].match(/^  topics:\s*\n((?:\s{4}-\s+.+\n?)+)/m)?.[1] ?? '';
  const topics = [...topicsBlock.matchAll(/^\s{4}-\s+(.+)$/gm)].map((topic) => topic[1].trim());
  if (!title) throw new Error(`${filename} has no title.`);
  // Unlisted posts are kept out of lists and search, and posts published
  // elsewhere have no page here, so neither is published.
  const unlisted = /^unlisted:\s*true\s*$/m.test(match[1]);
  const external = /^externalUrl:/m.test(match[1]);
  return { title, description, topics, body: match[2], withheld: unlisted || external };
}

export function postFromFile(filename, source) {
  const date = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  if (!date) throw new Error(`Unexpected post filename: ${filename}`);
  const data = frontmatter(source, filename);
  return {
    slug: date[2],
    ...data,
    publishedAt: new Date(`${date[1]}T12:00:00.000Z`).toISOString(),
  };
}

async function xrpc(service, method, body, token) {
  const response = await fetch(`${service}/xrpc/${method}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`${method}: ${response.status} ${await response.text()}`);
  return response.json();
}

async function uploadBlob(service, file, mimeType, token) {
  const response = await fetch(`${service}/xrpc/com.atproto.repo.uploadBlob`, {
    method: 'POST',
    headers: {
      'content-type': mimeType,
      authorization: `Bearer ${token}`,
    },
    body: file,
  });
  if (!response.ok) throw new Error(`com.atproto.repo.uploadBlob: ${response.status} ${await response.text()}`);
  const { blob } = await response.json();
  return blob;
}

async function main() {
  await loadDotenv();
  const handle = required('STANDARD_HANDLE');
  const password = required('STANDARD_APP_PASSWORD');
  const service = process.env.STANDARD_PDS ?? 'https://bsky.social';
  const session = await xrpc(service, 'com.atproto.server.createSession', { identifier: handle, password });
  const publicationUri = `at://${session.did}/${publicationCollection}/${publicationRkey}`;
  const publicationIcon = await uploadBlob(
    service,
    await readFile(publicationIconFile),
    'image/png',
    session.accessJwt,
  );

  // Deleting a record can fail without stopping the run; it ends failed so
  // it's noticed.
  const remove = async (collectionName, rkey, what) => {
    try {
      await xrpc(service, 'com.atproto.repo.deleteRecord', { repo: session.did, collection: collectionName, rkey }, session.accessJwt);
    } catch (error) {
      console.error(`Could not delete ${what}: ${error instanceof Error ? error.message : error}`);
      process.exitCode = 1;
    }
  };

  await xrpc(service, 'com.atproto.repo.putRecord', {
    repo: session.did,
    collection: publicationCollection,
    rkey: publicationRkey,
    record: {
      $type: publicationCollection,
      url: siteUrl,
      icon: publicationIcon,
      name: 'Andrew Lilley Brinker',
      description: 'Writing by Andrew Lilley Brinker about software engineering and security.',
      preferences: { showInDiscover: true },
    },
  }, session.accessJwt);

  await remove(publicationCollection, legacyPublicationRkey, 'the old publication record');

  const filenames = (await readdir(postsDirectory)).filter((name) => /^\d{4}-\d{2}-\d{2}-.+\.md$/.test(name));
  const documents = {};
  let published = 0;
  for (const filename of filenames) {
    const post = postFromFile(filename, await readFile(join(postsDirectory.pathname, filename), 'utf8'));
    const rkey = documentRkey(post);
    const uri = `at://${session.did}/${collection}/${rkey}`;
    await remove(collection, legacyDocumentRkey(post), `the old record for ${post.slug}`);
    // A withheld post's record is deleted, in case it was published before it
    // became unlisted. Deleting a record that isn't there does nothing.
    if (post.withheld) {
      await remove(collection, rkey, `${post.slug}'s record`);
      continue;
    }
    await xrpc(service, 'com.atproto.repo.putRecord', {
      repo: session.did,
      collection,
      rkey,
      record: {
        $type: collection,
        site: publicationUri,
        path: `/blog/${post.slug}/`,
        title: post.title,
        ...(post.description ? { description: post.description } : {}),
        publishedAt: post.publishedAt,
        ...(post.topics.length ? { tags: post.topics } : {}),
        content: {
          $type: 'at.markpub.markdown',
          text: {
            $type: 'at.markpub.text',
            markdown: post.body,
          },
        },
      },
    }, session.accessJwt);
    documents[post.slug] = uri;
    published++;
  }

  await mkdir(new URL('../public/.well-known/', import.meta.url), { recursive: true });
  await writeFile(metadataFile, `${JSON.stringify({ publicationUri, documents }, null, 2)}\n`);
  await writeFile(verificationFile, `${publicationUri}\n`);
  console.log(`Published ${published} documents, withheld ${filenames.length - published}, and updated verification metadata.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
