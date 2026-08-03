import { test, expect } from '@playwright/test';

/**
 * Percentage background-position resolves as (box - image) * percent. When the sprite
 * sheet is larger than its box — which it always is here — the N cells of an axis sit at
 * 0%, 1/(N-1), ... 100%, NOT at 0%, 1/N, ...
 *
 * A plain `steps(N)` emits 0, 1/N, ... (N-1)/N and never reaches 100%, so every frame
 * lands between two cells. Visually that reads as a smooth pan with two half-frames
 * showing, not a flipbook. `steps(N, jump-none)` emits exactly N values across 0%..100%
 * inclusive, one per cell.
 *
 * These tests sample the real animation rather than inspecting the CSS text, so they fail
 * if the timing function regresses for any reason.
 */

const SHEETS = [
  { label: 'Electric Flash', cols: 3, rows: 4, fps: 24 },
  { label: 'Smoke Arc', cols: 6, rows: 6, fps: 24 },
  { label: 'Dissipation', cols: 4, rows: 6, fps: 24 },
];

test.describe('flipbook sprite stepping', () => {
  for (const sheet of SHEETS) {
    test(`${sheet.label} lands on exact cell boundaries, never between them`, async ({ page }) => {
      await page.goto('/textures/');
      const el = page.locator(`[aria-label*="${sheet.label}"]`);
      await el.waitFor();
      await el.hover();
      await page.waitForTimeout(100);

      const xCycleMs = (sheet.cols / sheet.fps) * 1000;

      // The N legal x-positions for this grid, as percentages.
      const legal = Array.from({ length: sheet.cols }, (_, i) =>
        sheet.cols === 1 ? 0 : (i / (sheet.cols - 1)) * 100,
      );

      // Sample the middle of each step interval, where a misaligned value would be
      // unambiguous. Sampling at boundaries could pass by luck.
      const seen: number[] = [];
      for (let i = 0; i < sheet.cols; i++) {
        const atMs = (i + 0.5) * (xCycleMs / sheet.cols);
        const pct = await page.evaluate(
          ([label, ms]) => {
            const node = document.querySelector(`[aria-label*="${label}"]`) as HTMLElement;
            node.getAnimations().forEach((a) => {
              a.pause();
              a.currentTime = ms as number;
            });
            const x = getComputedStyle(node).backgroundPosition.split(' ')[0];
            return parseFloat(x);
          },
          [sheet.label, atMs] as const,
        );
        seen.push(pct);
      }

      for (const pct of seen) {
        const nearest = legal.reduce((a, b) => (Math.abs(b - pct) < Math.abs(a - pct) ? b : a));
        expect(
          Math.abs(nearest - pct),
          `background-position-x ${pct}% is not a cell boundary. ` +
            `Legal positions for ${sheet.cols} columns: ${legal.map((n) => n.toFixed(1) + '%').join(', ')}. ` +
            `This is the steps(N) vs steps(N, jump-none) bug.`,
        ).toBeLessThan(0.5);
      }

      // Every cell must be visited — a timing function that repeats one position
      // would satisfy the boundary check above but is still broken.
      expect(new Set(seen.map((n) => n.toFixed(1))).size).toBe(sheet.cols);
    });
  }

  test('the sheet stays visible and unanimated under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/textures/');
    const el = page.locator('[aria-label*="Electric Flash"]');
    await el.waitFor();
    await expect(el).toBeVisible();
    await el.hover();
    await page.waitForTimeout(150);
    expect(await el.evaluate((n) => n.getAnimations().length)).toBe(0);
  });
});
