import fs from 'node:fs';
import path from 'node:path';

/**
 * Number of texture entries that will actually render.
 *
 * Derived from the content directory rather than hardcoded. An exact literal breaks
 * every time a texture is legitimately added or removed, which says nothing about
 * whether the page works — the same brittleness that once pinned a unit test to
 * "exactly 11 texture files".
 */
export function publishedTextureCount(): number {
  const dir = path.join(process.cwd(), 'apps/vfx/content/textures');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.mdx'))
    .filter((f) => /^status:\s*published\s*$/m.test(fs.readFileSync(path.join(dir, f), 'utf8')))
    .length;
}
