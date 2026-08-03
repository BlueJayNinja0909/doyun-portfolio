import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { spriteFrameCount } from './sprite';

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be kebab-case');
const status = z.enum(['draft', 'published']).default('draft');

export const effectSchema = z.object({
  slug,
  title: z.string().min(1),
  status,
  video: z.string().min(1),
  poster: z.string().min(1),
  order: z.number().int().nonnegative().default(99),
  note: z.string().optional(),
  /** Texture slug this effect pairs with, for the texture-to-effect section. */
  pairsWith: slug.optional(),
});

export const textureSchema = z
  .object({
    slug,
    title: z.string().min(1),
    status,
    source: z.string().min(1),
    grid: z.object({
      cols: z.number().int().positive(),
      rows: z.number().int().positive(),
      frames: z.number().int().positive().optional(),
    }),
    fps: z.number().positive().default(24),
    note: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    try {
      spriteFrameCount(val.grid);
    } catch (e) {
      ctx.addIssue({ code: 'custom', message: (e as Error).message, path: ['grid', 'frames'] });
    }
  });

export type Effect = z.infer<typeof effectSchema>;
export type Texture = z.infer<typeof textureSchema>;

type MediaBearing = { status: string; media: string[] };

export function assertMediaExists(entries: MediaBearing[], publicDir: string): void {
  const missing: string[] = [];
  for (const entry of entries) {
    if (entry.status !== 'published') continue;
    for (const file of entry.media) {
      if (!fs.existsSync(path.join(publicDir, file))) missing.push(file);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Published entries reference missing media:\n${missing.map((m) => `  - ${m}`).join('\n')}\n` +
        `Either add the files to ${publicDir} or set those entries to status: draft.`,
    );
  }
}
