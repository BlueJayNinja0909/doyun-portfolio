import { test, expect } from '@playwright/test';

const ROUTES = ['/', '/work/transit-vs-driving/'];

/**
 * Contrast ratio between two computed rgb() colours, per WCAG.
 * Used instead of `toBeVisible()`, which only checks layout and hit-testing — the
 * assertion that let a white-on-white page pass every test on the sibling VFX site.
 */
function ratio(a: string, b: string): number {
  const lum = (c: string) => {
    const [r, g, bl] = (c.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
    const ch = (v: number) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(bl);
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

test.describe('the study renders and reads', () => {
  for (const route of ROUTES) {
    test(`${route} is light and readable regardless of OS theme`, async ({ page }) => {
      await page.goto(route);
      const { bg, fg } = await page.evaluate(() => ({
        bg: getComputedStyle(document.body).backgroundColor,
        fg: getComputedStyle(document.querySelector('h1')!).color,
      }));

      // Paper ground, dark ink — in both colour-scheme projects.
      expect(ratio(bg, fg), `${route} heading has poor contrast (${fg} on ${bg})`).toBeGreaterThan(7);
    });

    test(`${route} never scrolls sideways at 320px`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 800 });
      await page.goto(route);
      const over = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(over, `${route} overflows by ${over}px`).toBeLessThanOrEqual(0);
    });
  }

  test('the lead finding shows the real 21/4/21 split', async ({ page }) => {
    await page.goto('/work/transit-vs-driving/');
    const label = await page
      .getByRole('img', { name: /Route 1 by transit/ })
      .getAttribute('aria-label');

    // These are the study's actual numbers. If the chart ever drifts from routes.csv,
    // this is where it surfaces.
    expect(label).toContain('46 minutes');
    expect(label).toContain('21 minutes walking');
    expect(label).toContain('4 minutes on the bus');
  });

  test('the bus segment is drawn to scale, not enlarged for legibility', async ({ page }) => {
    await page.goto('/work/transit-vs-driving/');
    await page.waitForTimeout(900);
    const widths = await page.evaluate(() => {
      const bar = document.querySelector('[role="img"][aria-label*="Route 1 by transit"]')!;
      return [...bar.children].map((c) => (c as HTMLElement).getBoundingClientRect().width);
    });
    const total = widths.reduce((a, b) => a + b, 0);
    // 4 of 46 minutes is 8.7%. The whole argument is the proportion, so a chart that
    // quietly enlarges the bus segment to fit its label would undercut the point.
    expect(widths[1] / total).toBeGreaterThan(0.07);
    expect(widths[1] / total).toBeLessThan(0.11);
  });

  test('charts stay visible under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/work/transit-vs-driving/');
    await page.waitForTimeout(600);
    for (const name of [/Route 1 by transit/]) {
      await expect(page.getByRole('img', { name })).toBeVisible();
    }
    // Bars must have real width, not be stuck at scaleX(0).
    const anyZero = await page.evaluate(() => {
      const bar = document.querySelector('[role="img"][aria-label*="Route 1 by transit"]')!;
      return [...bar.children].some((c) => (c as HTMLElement).getBoundingClientRect().width < 2);
    });
    expect(anyZero, 'a chart segment rendered at zero width under reduced motion').toBe(false);
  });

  test('no phone number appears anywhere', async ({ page }) => {
    for (const route of ROUTES) {
      await page.goto(route);
      const text = await page.evaluate(() => document.body.innerText);
      expect(text, `${route} renders a phone-shaped string`).not.toMatch(
        /\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/,
      );
    }
  });

  test('no survey respondent is named', async ({ page }) => {
    // The raw survey CSV carries two real names. Aggregate figures are fine to publish;
    // identifiable respondents are not, absent explicit consent.
    await page.goto('/work/transit-vs-driving/');
    const text = await page.evaluate(() => document.body.innerText);
    for (const name of ['Minseo', 'Sakong', 'Mr. Shan']) {
      expect(text, `${name} is a survey respondent and must not be published`).not.toContain(name);
    }
  });
});
