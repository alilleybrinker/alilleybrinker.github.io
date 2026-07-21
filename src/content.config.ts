import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  taxonomies: z.object({
    type: z.array(z.string()).default([]),
    topics: z.array(z.string()).default([]),
  }).default({ type: [], topics: [] }),
});

export const collections = {
  blog: defineCollection({
    loader: glob({ base: './content/blog', pattern: '[0-9]*.md' }),
    schema: postSchema,
  }),
  mini: defineCollection({
    loader: glob({ base: './content/mini', pattern: '[0-9]*.md' }),
    schema: postSchema,
  }),
};
