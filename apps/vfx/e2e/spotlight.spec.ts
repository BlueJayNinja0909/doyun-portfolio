import { test, expect, type Locator } from '@playwright/test';

/**
 * Cursor spotlight on the reel tiles.
 *
 * The version this is adapted from attaches a `pointermove` listener to `document`
 * from inside every card. With sixteen tiles that is sixteen global listeners all
 * recomputing the same numbers on every mouse move. Here the handlers sit on the tile,
 * so only the hovered one does any work — these tests pin that behaviour along with
 * the visual result.
 */
test.describe('tile spotlight', () => {
  const vars = (locator: Locator) =>
    locator.evaluate((el: HTMLElement) => {
      const cs = getComputedStyle(el);
      return {
        opacity: cs.getPropertyValue('--spot-opacity').trim(),
        x: cs.getPropertyValue('--spot-x').trim(),
        y: cs.getPropertyValue('--spot-y').trim(),
      };
    });

  test('tracks the cursor within the hovered tile', async ({ page }) => {
    await page.goto('/');
    const tile = page.getByRole('button').first();
    const box = (await tile.boundingBox())!;

    await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.3, { steps: 8 });
    await page.waitForTimeout(350);
    const a = await vars(tile);

    expect(a.opacity, 'spotlight never became visible on hover').toBe('1');

    await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.7, { steps: 8 });
    await page.waitForTimeout(350);
    const b = await vars(tile);

    expect(parseFloat(b.x), 'spotlight did not follow the cursor horizontally').toBeGreaterThan(
      parseFloat(a.x),
    );
    expect(parseFloat(b.y), 'spotlight did not follow the cursor vertically').toBeGreaterThan(
      parseFloat(a.y),
    );
  });

  test('fades out when the cursor leaves', async ({ page }) => {
    await page.goto('/');
    const tile = page.getByRole('button').first();
    const box = (await tile.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
    await page.waitForTimeout(300);
    expect((await vars(tile)).opacity).toBe('1');

    await page.mouse.move(5, 5, { steps: 8 });
    await page.waitForTimeout(400);
    expect((await vars(tile)).opacity, 'spotlight stayed lit after the cursor left').toBe('0');
  });

  test('only the hovered tile lights up', async ({ page }) => {
    await page.goto('/');
    const first = page.getByRole('button').first();
    const second = page.getByRole('button').nth(1);
    const box = (await first.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
    await page.waitForTimeout(300);

    expect((await vars(first)).opacity).toBe('1');
    expect((await vars(second)).opacity, 'a tile lit up without being hovered').toBe('0');
  });

  test('the title stays above the glow', async ({ page }) => {
    await page.goto('/');
    const z = await page.evaluate(() => {
      const label = document.querySelector('button span') as HTMLElement;
      return getComputedStyle(label).zIndex;
    });
    // The wash is z-1 and the border light z-2; the title must clear both or the
    // effect washes over the one piece of text that has to stay legible.
    expect(Number(z)).toBeGreaterThan(2);
  });

  test('is suppressed entirely under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const tile = page.getByRole('button').first();
    const box = (await tile.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
    await page.waitForTimeout(300);

    const display = await tile.evaluate((el) => getComputedStyle(el, '::before').display);
    expect(display, 'spotlight renders under prefers-reduced-motion').toBe('none');
    expect((await vars(tile)).opacity, 'spotlight opacity was still driven').toBe('0');
  });

  test('hovering still fetches only the small preview', async ({ page }) => {
    // The spotlight shares pointer handlers with the hover-preview logic, so this
    // guards against the two interfering.
    const videos: string[] = [];
    page.on('request', (r) => {
      if (r.url().endsWith('.mp4')) videos.push(r.url());
    });
    await page.goto('/');
    await page.getByRole('button').first().hover();
    await page.waitForTimeout(500);
    for (const url of videos) expect(url).toMatch(/-preview\.mp4$/);
  });
});
