import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import remarkLegacyLinks from './src/lib/remark-legacy-links.ts';
import rehypeTypeset from './src/lib/typeset.ts';

export default defineConfig({
  site: 'https://www.alilleybrinker.com',
  output: 'static',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  redirects: {
    '/topics/': '/',
  },
  markdown: {
    processor: unified({ remarkPlugins: [remarkLegacyLinks], rehypePlugins: [rehypeTypeset] }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
