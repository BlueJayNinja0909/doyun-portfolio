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

  test('the avatar renders and leans toward the cursor', async ({ page }) => {
    await page.goto('/');
    const img = page.locator('[data-testid="avatar"] img');
    await expect(img).toBeVisible();

    // It must be the real render, not a placeholder.
    const loaded = await img.evaluate(
      (el: HTMLImageElement) => el.complete && el.naturalWidth > 100,
    );
    expect(loaded, 'the avatar image did not load').toBe(true);

    const transform = () =>
      page.locator('[data-testid="avatar"] img').evaluate(
        (el) => getComputedStyle(el.parentElement!).transform,
      );

    await page.mouse.move(80, 700, { steps: 10 });
    await page.waitForTimeout(600);
    const left = await transform();

    await page.mouse.move(1200, 120, { steps: 10 });
    await page.waitForTimeout(600);
    const right = await transform();

    expect(left, 'the avatar never tilted').not.toBe('none');
    expect(right, 'the avatar did not respond to a cursor move').not.toBe(left);
  });

  test('the avatar is served locally, not hot-linked from Roblox', async ({ page }) => {
    // Hot-linking would put a hero image on a CDN outside this site's control, and
    // Roblox thumbnail URLs are regenerated periodically — the link would rot.
    const external: string[] = [];
    page.on('request', (r) => {
      const u = r.url();
      if (/rbxcdn|roblox\.com/i.test(u)) external.push(u);
    });
    await page.goto('/');
    await page.waitForTimeout(1200);
    expect(external, 'the page requested assets from Roblox at runtime').toEqual([]);

    const src = await page.locator('[data-testid="avatar"] img').getAttribute('src');
    expect(src).toMatch(/^\/avatar\//);
  });

  test('the avatar reserves its box before the scene loads', async ({ page }) => {
    await page.goto('/');
    // The wrapper is sized by the page, not by whatever loads inside it — otherwise
    // the hero text reflows when three.js finishes downloading.
    const box = await page.locator('[data-testid="avatar"]').boundingBox();
    expect(box!.height, 'the avatar container has no reserved height').toBeGreaterThan(200);
  });

  test('the avatar is visible but static under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    // Reduced motion means less movement, not a hole in the layout — the avatar is
    // content, and it still renders.
    await expect(page.locator('[data-testid="avatar"] img')).toBeVisible();

    const before = await page
      .locator('[data-testid="avatar"] img')
      .evaluate((el) => getComputedStyle(el.parentElement!).transform);

    await page.mouse.move(1200, 120, { steps: 10 });
    await page.waitForTimeout(600);

    const after = await page
      .locator('[data-testid="avatar"] img')
      .evaluate((el) => getComputedStyle(el.parentElement!).transform);

    expect(after, 'the avatar tilted despite prefers-reduced-motion').toBe(before);
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
