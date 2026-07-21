import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import { unified } from '@astrojs/markdown-remark';
import remarkLegacyLinks from './src/lib/remark-legacy-links.ts';

export default defineConfig({
  site: 'https://www.alilleybrinker.com',
  output: 'static',
  markdown: {
    processor: unified({ remarkPlugins: [remarkLegacyLinks] }),
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
