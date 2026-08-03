import { test, expect } from '@playwright/test';

test.describe('intro page', () => {
  test('the wordmark is a gradient and is never invisible', async ({ page }) => {
    await page.goto('/');
    const span = page.locator('h1 span').first();

    const s = await span.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        image: cs.backgroundImage,
        fill: cs.webkitTextFillColor,
        clip: cs.webkitBackgroundClip || cs.backgroundClip,
        width: el.getBoundingClientRect().width,
      };
    });

    expect(s.image, 'no gradient was applied to the wordmark').toContain('gradient');
    // Transparent fill is only safe *because* the gradient is clipped to the glyphs.
    // If the clip ever stopped applying, the wordmark would vanish entirely — so the
    // two must always agree.
    if (s.fill.includes('rgba(0, 0, 0, 0)')) {
      expect(s.clip, 'text fill is transparent but the gradient is not clipped to text').toBe(
        'text',
      );
    }
    expect(s.width, 'the wordmark collapsed to nothing').toBeGreaterThan(100);
    await expect(span).toHaveText('Doyun Lee VFX');
  });

  test('the avatar renders and tracks the cursor', async ({ page }) => {
    await page.goto('/');
    const canvas = page.locator('[data-testid="avatar"] canvas');
    await expect(canvas).toBeAttached({ timeout: 15_000 });

    // The canvas must actually draw something, not just exist.
    const drew = await canvas.evaluate((el: HTMLCanvasElement) => el.width > 0 && el.height > 0);
    expect(drew, 'the avatar canvas has no drawing surface').toBe(true);
  });

  test('the avatar reserves its box before the scene loads', async ({ page }) => {
    await page.goto('/');
    // The wrapper is sized by the page, not by whatever loads inside it — otherwise
    // the hero text reflows when three.js finishes downloading.
    const box = await page.locator('[data-testid="avatar"]').boundingBox();
    expect(box!.height, 'the avatar container has no reserved height').toBeGreaterThan(200);
  });

  test('three.js is never downloaded under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const chunks: string[] = [];
    page.on('request', (r) => {
      if (r.url().endsWith('.js')) chunks.push(r.url());
    });

    await page.goto('/');
    await page.waitForTimeout(2500);

    // A visitor who asked for reduced motion gets the static silhouette. Shipping them
    // ~150KB of 3D library for something that will never animate is pure waste.
    const canvas = await page.locator('[data-testid="avatar"] canvas').count();
    expect(canvas, 'the 3D scene mounted despite prefers-reduced-motion').toBe(0);

    // The silhouette still has to be there — reduced motion means less movement,
    // not a hole in the layout.
    await expect(page.locator('[data-testid="avatar"] svg')).toBeVisible();
  });

  test('the reel is still reachable and loads no video up front', async ({ page }) => {
    const videos: string[] = [];
    page.on('request', (r) => {
      if (r.url().endsWith('.mp4')) videos.push(r.url());
    });

    await page.goto('/');
    // The intro must not have broken the site's core performance contract.
    expect(videos, 'video was fetched on the intro page').toEqual([]);

    await page.getByRole('link', { name: /see the work/i }).click();
    await page.waitForTimeout(600);

    const tiles = page.getByRole('button');
    expect(await tiles.count()).toBeGreaterThan(5);
    await expect(tiles.first()).toBeVisible();
  });

  test('the scroll transform is skipped under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, 900));
    await page.waitForTimeout(500);

    // A 22-degree scroll-linked rotation is exactly what this setting exists to stop.
    const rotated = await page.evaluate(() => {
      const panels = [...document.querySelectorAll('div')].filter((d) =>
        getComputedStyle(d).transform.startsWith('matrix3d'),
      );
      return panels.length;
    });
    expect(rotated, 'a 3D scroll transform is applied under reduced motion').toBe(0);

    // And the reel must still be reachable and visible.
    await expect(page.getByRole('button').first()).toBeVisible();
  });

  test('no horizontal overflow at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/');
    await page.waitForTimeout(800);
    const over = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(over, `intro overflows by ${over}px`).toBeLessThanOrEqual(0);
  });
});
