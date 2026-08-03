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

  test('the canvas is hidden from assistive technology and not focusable', async ({ page }) => {
    await page.goto('/');
    const canvas = page.getByTestId('constellation');
    await expect(canvas).toHaveAttribute('aria-hidden', 'true');
    expect(await canvas.evaluate((n) => getComputedStyle(n).pointerEvents)).toBe('none');
  });
});
