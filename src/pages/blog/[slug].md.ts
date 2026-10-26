import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { postMarkdown } from '../../lib/markdown';
import { postSlug } from '../../lib/site';

export const getStaticPaths = (async () => {
  return (await getCollection('blog'))
    .filter((post) => !post.data.externalUrl)
    .map((post) => ({ params: { slug: postSlug(post) }, props: { post } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props, site }) =>
  new Response(postMarkdown(props.post, site!), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
  });
