import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  externalUrl: z.string().url().optional(),
  publication: z.string().optional(),
  publicationTitle: z.string().optional(),
  readingTime: z.number().int().positive().optional(),
  unlisted: z.boolean().default(false),
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
