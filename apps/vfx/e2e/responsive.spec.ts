import { test, expect } from '@playwright/test';

/**
 * The page body must never scroll horizontally.
 *
 * This regressed when the wordmark changed from "Doyun.vfx" to "Doyun Lee VFX": the
 * name is held together by a non-breaking space, so it has a hard minimum width, and
 * at a fixed 60px it measured 342px and pushed a 320px viewport 22px sideways. Nothing
 * in the suite caught it, because every other test ran at desktop width.
 *
 * 320px is the narrowest viewport still worth supporting (iPhone SE, older Androids).
 */
const WIDTHS = [320, 360, 390, 414, 768, 1024, 1440];
const ROUTES = ['/', '/textures/', '/commissions/'];

test.describe('no horizontal overflow', () => {
  for (const width of WIDTHS) {
    test(`at ${width}px, no route scrolls sideways`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });

      for (const route of ROUTES) {
        await page.goto(route);
        await page.waitForTimeout(250);

        const { scrollW, clientW } = await page.evaluate(() => ({
          scrollW: document.documentElement.scrollWidth,
          clientW: document.documentElement.clientWidth,
        }));

        expect(
          scrollW - clientW,
          `${route} overflows by ${scrollW - clientW}px at ${width}px wide. ` +
            'Something has a minimum width larger than the viewport — check the ' +
            'hero type scale and any non-breaking spaces in headings.',
        ).toBeLessThanOrEqual(0);
      }
    });
  }

  test('the hero scales down rather than clipping on a narrow screen', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/');
    const narrow = await page.evaluate(
      () => parseFloat(getComputedStyle(document.querySelector('h1')!).fontSize),
    );

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(200);
    const wide = await page.evaluate(
      () => parseFloat(getComputedStyle(document.querySelector('h1')!).fontSize),
    );

    expect(narrow, 'hero type did not shrink on a narrow viewport').toBeLessThan(wide);
    expect(wide, 'hero type lost its size on desktop').toBeGreaterThan(60);
  });
});
