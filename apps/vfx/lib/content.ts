import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { effectSchema, textureSchema, assertMediaExists, type Effect, type Texture } from './schema';

const CONTENT = path.join(process.cwd(), 'content');
const PUBLIC = path.join(process.cwd(), 'public');

function readDir<T>(dir: string, parse: (data: unknown, file: string) => T): T[] {
  const full = path.join(CONTENT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => parse(matter(fs.readFileSync(path.join(full, f), 'utf8')).data, f));
}

export function loadEffects(): Effect[] {
  const all = readDir('effects', (data, file) => {
    const result = effectSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Invalid frontmatter in content/effects/${file}:\n${result.error.message}`);
    }
    return result.data;
  });
  // The hover preview is derived from the slug rather than declared in frontmatter —
  // scripts/process-vfx.mjs always emits <slug>-preview.mp4 alongside the clip, so
  // there is nothing for an author to get wrong. Checking it here means a published
  // effect whose preview was never generated fails the build instead of shipping a
  // tile that silently does nothing on hover.
  assertMediaExists(
    all.map((e) => ({
      status: e.status,
      media: [`videos/${e.video}`, `videos/${e.poster}`, `videos/${e.slug}-preview.mp4`],
    })),
    PUBLIC,
  );
  return all.filter((e) => e.status === 'published').sort((a, b) => a.order - b.order);
}

export function loadTextures(): Texture[] {
  const all = readDir('textures', (data, file) => {
    const result = textureSchema.safeParse(data);
    if (!result.success) {
      throw new Error(`Invalid frontmatter in content/textures/${file}:\n${result.error.message}`);
    }
    return result.data;
  });
  assertMediaExists(
    all.map((t) => ({ status: t.status, media: [`textures/${t.slug}.webp`] })),
    PUBLIC,
  );
  return all.filter((t) => t.status === 'published');
}
