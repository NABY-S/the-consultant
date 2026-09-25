import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const tracks = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/tracks' }),
  schema: z.object({
    order: z.number().int(),
    title: z.string(),
    summary: z.string(),
    icon: z.enum(['code', 'cloud', 'ai', 'megaphone', 'chart', 'shield', 'grid', 'phone', 'check', 'book']),
    levels: z.array(z.enum(['JHS', 'SHS', 'University'])).nonempty(),
    modules: z.array(z.string()).nonempty(),
  }),
});

export const collections = { tracks };
