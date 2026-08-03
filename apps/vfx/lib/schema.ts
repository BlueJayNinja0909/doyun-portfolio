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
  /** Intrinsic poster/video dimensions in pixels — required so the lightbox
   * can reserve the correct box before load without guessing. Clips are not
   * all the same aspect ratio (e.g. ink-swing was re-recorded without the
   * Roblox Studio side panels, so it crops to 1280x584 vs 1280x638 for the
   * rest), so this must come from real per-entry metadata, not a constant. */
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  /**
   * Which section of the reel this belongs to. Defaults to `practice` so a new entry
   * never lands in the featured row by omission — promoting work should be a
   * deliberate edit, not the result of forgetting a field.
   */
  tier: z.enum(['featured', 'practice']).default('practice'),
  order: z.number().int().nonnegative().default(99),
  note: z.string().optional(),
});

export const textureSchema = z
  .object({
    slug,
    title: z.string().min(1),
    status,
    /** Provenance only (e.g. the original flipbook filename) — not a URL
     * or path. Public files are served from `<slug>.webp`; nothing reads
     * this field to resolve where the asset lives. */
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
