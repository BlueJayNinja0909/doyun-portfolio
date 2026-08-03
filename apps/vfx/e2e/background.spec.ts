import { test, expect } from '@playwright/test';

/**
 * The background stack has now hidden itself twice: first the ambient gradient painted
 * behind an opaque `body`, then an opaque `.ambient` painted over the constellation
 * canvas. Both times every existing test stayed green, because nothing asserted that
 * these layers put pixels on the screen — only that the elements existed.
 *
 * These tests read the canvas backing store and the computed stacking order directly,
 * so a layer that renders invisibly fails here.
 */

const ROUTES = ['/', '/textures/', '/commissions/'];

test.describe('background layers', () => {
  test('the constellation canvas actually paints pixels', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(700);

    const lit = await page.evaluate(() => {
      const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      if (!canvas) return -1;
      const ctx = canvas.getContext('2d');
      if (!ctx) return -1;
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let n = 0;
      // Stride is coprime-ish with the row width so samples don't align to a column.
      for (let i = 3; i < data.length; i += 4 * 37) if (data[i] > 6) n++;
      return n;
    });

    expect(lit, 'canvas exists but drew nothing').toBeGreaterThan(0);
    expect(
      lit,
      'the constellation drew too few pixels to be visible — check node density',
    ).toBeGreaterThan(40);
  });

  test('the constellation is stacked above the ambient layer, not below it', async ({ page }) => {
    await page.goto('/');
    const order = await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const ambient = document.querySelector('.ambient');
      if (!canvas || !ambient) return null;
      return {
        canvasZ: Number(getComputedStyle(canvas).zIndex),
        ambientZ: Number(getComputedStyle(ambient).zIndex),
        ambientBg: getComputedStyle(ambient).backgroundColor,
      };
    });

    expect(order).not.toBeNull();
    expect(
      order!.canvasZ,
      'the canvas sits behind .ambient, which will paint over it',
    ).toBeGreaterThan(order!.ambientZ);

    // An opaque .ambient hides everything behind it regardless of z-index. The ground
    // colour belongs on <html>.
    expect(
      order!.ambientBg,
      '.ambient has an opaque background-color and will hide the constellation',
    ).toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
  });

  for (const route of ROUTES) {
    test(`the constellation renders on ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.getByTestId('constellation')).toBeAttached();
    });
  }

  test('no animation loop runs under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.waitForTimeout(500);

    // A static field is still drawn — it just must not be re-drawn every frame.
    const framesObserved = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let count = 0;
          const canvas = document.querySelector('canvas') as HTMLCanvasElement;
          const ctx = canvas.getContext('2d')!;
          const original = ctx.clearRect.bind(ctx);
          // clearRect is called once per animation frame by the draw loop.
          (ctx as CanvasRenderingContext2D).clearRect = ((...args: Parameters<typeof original>) => {
            count++;
            return original(...args);
          }) as typeof original;
          setTimeout(() => resolve(count), 600);
        }),
    );

    expect(
      framesObserved,
      'the constellation is animating despite prefers-reduced-motion: reduce',
    ).toBeLessThanOrEqual(1);
  });

  // Direction of travel is asserted in lib/__tests__/constellation.test.ts, not here.
  // Sampling the canvas cannot prove it: once nodes wrap from top to bottom the field
  // reaches equilibrium and its pixel centroid becomes statistically stationary, so a
  // centroid-based test measures a startup transient and then stops being true —
  // it failed both with the bug present and with it fixed.
  //
  // What the rendered canvas *can* prove is that the field does not drain, which is
  // the failure a wrap bug would actually cause on screen.
  test('the field keeps its density instead of draining off the top', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(800);

    const litPixels = () =>
      page.evaluate(() => {
        const c = document.querySelector('canvas') as HTMLCanvasElement;
        const ctx = c.getContext('2d')!;
        const { data } = ctx.getImageData(0, 0, c.width, c.height);
        let n = 0;
        for (let i = 3; i < data.length; i += 4 * 11) if (data[i] > 8) n++;
        return n;
      });

    const before = await litPixels();
    expect(before, 'nothing was drawn to sample').toBeGreaterThan(0);

    await page.waitForTimeout(4000);
    const after = await litPixels();

    expect(
      after,
      'density collapsed as nodes drifted off-screen — nodes leaving the top are not re-entering at the bottom',
    ).toBeGreaterThan(before * 0.6);
  });

  test('the canvas is hidden from assistive technology and not focusable', async ({ page }) => {
    await page.goto('/');
    const canvas = page.getByTestId('constellation');
    await expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(await canvas.evaluate((n) => getComputedStyle(n).pointerEvents)).toBe('none');
  });
});

test.describe('cursor glow', () => {
  test('follows the pointer and never intercepts clicks', async ({ page }) => {
    await page.goto('/');
    const glow = page.getByTestId('cursor-glow');
    await expect(glow).toBeAttached();
    await expect(glow).toHaveAttribute('aria-hidden', 'true');
    expect(await glow.evaluate((n) => getComputedStyle(n).pointerEvents)).toBe('none');

    const read = () =>
      glow.evaluate((n) => {
        const m = new DOMMatrixReadOnly(getComputedStyle(n).transform);
        return { x: m.m41, y: m.m42, opacity: Number(getComputedStyle(n).opacity) };
      });

    await page.mouse.move(300, 250, { steps: 10 });
    await page.waitForTimeout(500);
    const a = await read();

    await page.mouse.move(900, 600, { steps: 10 });
    await page.waitForTimeout(500);
    const b = await read();

    expect(a.opacity, 'the glow never became visible after pointer movement').toBeGreaterThan(0);
    expect(
      Math.hypot(b.x - a.x, b.y - a.y),
      'the glow did not move with the pointer',
    ).toBeGreaterThan(200);
  });
});

test.describe('texture sheet loading', () => {
  // 19 sheets total ~1.6MB. CSS background images have no loading="lazy", so without
  // deferral the textures page blows the 800KB initial-weight budget on first paint.
  test('sheets below the fold are not fetched until scrolled toward', async ({ page }) => {
    const sheets = new Set<string>();
    page.on('request', (r) => {
      const u = r.url();
      if (u.endsWith('.webp') && !u.endsWith('ambient.webp')) sheets.add(u);
    });

    await page.goto('/textures/');
    await page.waitForTimeout(1200);
    const initial = sheets.size;

    const total = await page.locator('[data-testid="flipbook-frame"]').count();
    expect(total).toBeGreaterThan(12);
    expect(
      initial,
      `all ${total} sheets loaded on first paint — the lazy attach is not working. ` +
        'A likely cause is seeding the visible state from `typeof IntersectionObserver`, ' +
        'which is undefined during prerender and bakes the url() into the static HTML.',
    ).toBeLessThan(total);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    expect(sheets.size, 'sheets never loaded after scrolling to them').toBe(total);
  });
});
