import { describe, expect, test } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const clips = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'scripts/clips.json'), 'utf8'));
const SRC = path.join(process.cwd(), '_inbox/vfx/VFX Showcase');

describe('clip manifest', () => {
  test('every source file exists on disk', () => {
    const missing = clips.filter((c) => !fs.existsSync(path.join(SRC, c.src)));
    expect(missing.map((m) => m.src)).toEqual([]);
  });

  test('slugs are unique and kebab-case', () => {
    const slugs = clips.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    slugs.forEach((s) => expect(s).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
  });

  test('crop values are w:h:x:y with even width and height', () => {
    clips.forEach((c) => {
      const [w, h] = c.crop.split(':').map(Number);
      expect(c.crop).toMatch(/^\d+:\d+:\d+:\d+$/);
      expect(w % 2).toBe(0);
      expect(h % 2).toBe(0);
    });
  });
});
