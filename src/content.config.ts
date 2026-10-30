import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { typesetText } from './lib/typeset';

const postSchema = z.object({
  // Front matter skips Markdown's smart quotes, so titles and descriptions are
  // typeset here, once, for everywhere they appear.
  title: z.string().transform(typesetText),
  description: z.string().transform(typesetText).optional(),
  externalUrl: z.string().url().optional(),
  publication: z.string().optional(),
  publicationTitle: z.string().optional(),
  readingTime: z.number().int().positive().optional(),
  // When a post was last meaningfully revised, as YYYY-MM-DD. Shown beside its
  // date and given to search engines; leave it out for typo fixes.
  updated: z.coerce.date().optional(),
  unlisted: z.boolean().default(false),
  // Posts that form a series share this name, which only groups them: each
  // shows its place and links the others, listed by their own titles.
  series: z.string().optional(),
  taxonomies: z.object({
    type: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
  }).default({ type: [], topics: [] }),
  extra: z.object({
    toc: z.boolean().default(false),
  }).default({ toc: false }),
});

export const collections = {
  blog: defineCollection({
    loader: glob({ base: './content/blog', pattern: '[0-9]*.md' }),
    schema: postSchema,
  }),
};
