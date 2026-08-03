import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { describe, expect, test } from 'vitest';
import { effectSchema, textureSchema, assertMediaExists } from '../schema';

describe('effectSchema', () => {
  const valid = {
    slug: 'arrow-rain',
    title: 'Arrow Rain',
    status: 'published',
    video: 'arrow-rain.mp4',
    poster: 'arrow-rain-poster.jpg',
    width: 1280,
    height: 638,
    order: 1,
  };

  test('accepts a complete entry', () => {
    expect(effectSchema.parse(valid)).toMatchObject({ slug: 'arrow-rain' });
  });

  test('defaults status to draft so nothing publishes by accident', () => {
    const { status, ...rest } = valid;
    expect(effectSchema.parse(rest).status).toBe('draft');
  });

  test('rejects a slug with spaces or capitals', () => {
    expect(() => effectSchema.parse({ ...valid, slug: 'Arrow Rain' })).toThrow();
  });

  test('rejects an unknown status', () => {
    expect(() => effectSchema.parse({ ...valid, status: 'live' })).toThrow();
  });
});

describe('textureSchema', () => {
  test('rejects a frame count larger than the grid', () => {
    expect(() =>
      textureSchema.parse({
        slug: 'x', title: 'X', status: 'published', source: 'a.webp',
        grid: { cols: 4, rows: 4, frames: 20 }, fps: 24,
      }),
    ).toThrow(/exceeds grid capacity/);
  });
});

describe('textureSchema against real content', () => {
  const texturesDir = path.join(__dirname, '..', '..', 'content', 'textures');
  const files = fs.readdirSync(texturesDir).filter((f) => f.endsWith('.mdx'));

  test('found texture files to validate (directory is not silently empty)', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  test.each(files)('%s frontmatter validates against textureSchema', (file) => {
    const { data } = matter(fs.readFileSync(path.join(texturesDir, file), 'utf8'));
    expect(() => textureSchema.parse(data)).not.toThrow();
  });
});

describe('loadTextures', () => {
  // content.ts resolves its content/public dirs off process.cwd() at *module
  // import* time, matching how `npm run build -w @doyun/vfx` actually executes
  // (npm sets cwd to the package dir before running the script). Vitest doesn't
  // chdir workers to --root, so to get real behaviour regardless of where
  // `vitest` was invoked from, chdir first and then dynamically import the
  // module so its top-level CONTENT/PUBLIC constants pick up the right cwd.
  test('resolves every published texture against public/textures/<slug>.webp without throwing', async () => {
    const appDir = path.join(__dirname, '..', '..');
    const prevCwd = process.cwd();
    process.chdir(appDir);
    try {
      const { loadTextures } = await import('../content');
      const textures = loadTextures();
      expect(textures.length).toBeGreaterThan(0);
      textures.forEach((t) => {
        expect(fs.existsSync(path.join(appDir, 'public', 'textures', `${t.slug}.webp`))).toBe(true);
      });
    } finally {
      process.chdir(prevCwd);
    }
  });
});

describe('assertMediaExists', () => {
  test('ignores drafts with missing media', () => {
    expect(() =>
      assertMediaExists([{ status: 'draft', media: ['nope.mp4'] }], '/tmp/definitely-missing'),
    ).not.toThrow();
  });

  test('throws listing every missing file for published entries', () => {
    expect(() =>
      assertMediaExists(
        [{ status: 'published', media: ['a.mp4', 'b.jpg'] }],
        '/tmp/definitely-missing',
      ),
    ).toThrow(/a\.mp4[\s\S]*b\.jpg/);
  });
});
