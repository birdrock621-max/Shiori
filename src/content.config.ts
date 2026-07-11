import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const recordTypes = [
  'diary',
  'development',
  'learning',
  'task',
  'activity',
  'note',
] as const;

export const moods = ['bright', 'calm', 'focused', 'tired', 'curious', 'proud'] as const;

const records = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/records' }),
  schema: z
    .object({
      title: z.string().min(1).max(120),
      date: z.coerce.date(),
      updated: z.coerce.date().optional(),
      type: z.enum(recordTypes).default('note'),
      summary: z.string().min(1).max(240),
      tags: z.array(z.string().min(1).max(32)).max(24).default([]),
      project: z.string().min(1).max(64).optional(),
      mood: z.enum(moods).optional(),
      featured: z.boolean().default(false),
      draft: z.boolean().default(false),
      sample: z.boolean().default(false),
      cover: z.string().startsWith('/images/').optional(),
      cover_alt: z.string().min(1).max(180).optional(),
      tasks: z
        .array(
          z.object({
            text: z.string().min(1).max(160),
            done: z.boolean(),
          }),
        )
        .max(40)
        .default([]),
    }).strict()
    .superRefine((data, ctx) => {
      if (data.cover && !data.cover_alt) {
        ctx.addIssue({
          code: 'custom',
          path: ['cover_alt'],
          message: 'cover_alt is required when cover is set',
        });
      }
    }),
});

export const collections = { records };
