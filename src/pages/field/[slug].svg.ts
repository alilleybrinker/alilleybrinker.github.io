import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { ditherPath, fieldFor, fieldValue, smoothstep } from '../../lib/dither-pattern';
import { postPath, postSlug } from '../../lib/site';

// The still field that closes each post: the field the post opens with,
// turned upside down so it rises from the bottom, and fading out at the
// sides. It's a mask, so the page colors it for the theme. Cells are the live
// field's 3px; the width is an even number of pixels so it centers crisply.
const cell = 3;
const columns = 342;
const rows = 110;

export async function getStaticPaths() {
  return (await getCollection('blog'))
    .filter((post) => !post.data.externalUrl)
    .map((post) => ({ params: { slug: postSlug(post) }, props: { path: postPath(post) } }));
}

export const GET: APIRoute = ({ props }) => {
  const shape = fieldFor(props.path);
  const path = ditherPath(columns, rows, cell, (u, v) =>
    0.22 * smoothstep(0.35, 1.2, fieldValue(shape, u, 1 - v, columns, rows))
      * smoothstep(0.05, 0.8, v) * smoothstep(0, 0.2, u) * (1 - smoothstep(0.8, 1, u)));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${columns * cell}" height="${rows * cell}" viewBox="0 0 ${columns * cell} ${rows * cell}" shape-rendering="crispEdges"><path d="${path}"/></svg>`;
  return new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } });
};
