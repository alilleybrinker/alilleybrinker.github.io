import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { postDate, postSlug, type Post } from '../../lib/site';

const width = 1356;
const height = 628;
const avatar = await readFile(resolve(process.cwd(), 'public/image/andrew_lineart-card-transparent.png'));
const fontFiles = [
  resolve(process.cwd(), 'src/assets/fonts/PublicSans-Regular.ttf'),
  resolve(process.cwd(), 'src/assets/fonts/PublicSans-Semibold.ttf'),
  resolve(process.cwd(), 'src/assets/fonts/Merriweather-Regular.ttf'),
];

function escapeXml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&apos;',
    '"': '&quot;',
  }[character] ?? character));
}

function wrapTitle(title: string, maxCharacters = 20) {
  const lines: string[] = [];
  let line = '';

  for (const word of title.split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxCharacters && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  if (lines.length <= 3) return lines;
  return [...lines.slice(0, 2), `${lines.slice(2).join(' ').slice(0, maxCharacters - 1)}…`];
}

function socialCard(post: Post) {
  const date = postDate(post).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const titleLines = wrapTitle(post.data.title);
  const titleY = titleLines.length === 1 ? 375 : titleLines.length === 2 ? 310 : 250;
  const title = titleLines
    .map((line, index) => `<text x="130" y="${titleY + index * 108}" class="title">${escapeXml(line)}</text>`)
    .join('');

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <style>
        .brand { fill: #262626; font-family: 'Public Sans'; font-size: 30px; font-weight: 600; }
        .title { fill: #000000; font-family: Merriweather; font-size: 92px; font-weight: 400; }
        .date { fill: #737373; font-family: 'Public Sans'; font-size: 30px; font-weight: 400; }
      </style>
      <rect width="100%" height="100%" fill="#fafaf9" />
      <defs><clipPath id="avatar"><circle cx="130" cy="96" r="44" /></clipPath></defs>
      <image x="86" y="52" width="88" height="88" href="data:image/png;base64,${avatar.toString('base64')}" xlink:href="data:image/png;base64,${avatar.toString('base64')}" clip-path="url(#avatar)" />
      <text x="198" y="106" class="brand">Andrew Lilley Brinker</text>
      ${title}
      <text x="130" y="550" class="date">${date}</text>
    </svg>`;
}

export async function getStaticPaths() {
  return (await getCollection('blog')).map((post) => ({
    params: { slug: postSlug(post) },
    props: { post },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: Post };
  const image = new Resvg(socialCard(post), {
    font: {
      fontFiles,
      loadSystemFonts: false,
    },
  }).render().asPng();

  return new Response(image, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
