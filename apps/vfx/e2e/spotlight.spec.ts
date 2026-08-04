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
    // The reel now sits below the intro, so the tile must be scrolled into view before
    // its box is in viewport coordinates the mouse can actually reach.
    await tile.scrollIntoViewIfNeeded();
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
    // The reel now sits below the intro, so the tile must be scrolled into view before
    // its box is in viewport coordinates the mouse can actually reach.
    await tile.scrollIntoViewIfNeeded();
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
    await first.scrollIntoViewIfNeeded();
    const box = (await first.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
    await page.waitForTimeout(300);

    expect((await vars(first)).opacity).toBe('1');
    expect((await vars(second)).opacity, 'a tile lit up without being hovered').toBe('0');
  });

  test('the title stays above the glow', async ({ page }) => {
    await page.goto('/');
    const z = await page.evaluate(() => {
      // The title row is the element containing the effect name — not the first span,
      // which is the media wrapper.
      const row = [...document.querySelectorAll('button > span')].find((s) =>
        s.textContent?.includes('Arrow Rain'),
      ) as HTMLElement;
      return getComputedStyle(row).zIndex;
    });
    // The border light is z-2; the title must clear it or the effect washes over the
    // one piece of text that has to stay legible.
    expect(Number(z)).toBeGreaterThan(2);
  });

  test('the wash is removed while a clip is playing', async ({ page }) => {
    // A coloured film over footage is exactly what makes an effect harder to judge,
    // and showing the effect is the only job these tiles have.
    await page.goto('/');
    const tile = page.getByRole('button').first();
    // The reel now sits below the intro, so the tile must be scrolled into view before
    // its box is in viewport coordinates the mouse can actually reach.
    await tile.scrollIntoViewIfNeeded();
    const box = (await tile.boundingBox())!;

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
    // Long enough for the 150ms hover-intent delay to arm the preview.
    await page.waitForTimeout(1200);

    expect(
      await tile.evaluate((el) => el.hasAttribute('data-previewing')),
      'the preview never started, so this test proves nothing',
    ).toBe(true);

    expect(
      await tile.evaluate((el) => getComputedStyle(el, '::before').opacity),
      'the interior wash is still drawn over a playing clip',
    ).toBe('0');

    // The border light sits on the card edge, outside the inset media, so it stays.
    expect(
      await tile.evaluate((el) => getComputedStyle(el, '::after').opacity),
      'the border light was removed along with the wash',
    ).toBe('1');
  });

  test('nothing is painted over the media while a clip plays', async ({ page }) => {
    await page.goto('/');
    const tile = page.getByRole('button').first();
    // The reel now sits below the intro, so the tile must be scrolled into view before
    // its box is in viewport coordinates the mouse can actually reach.
    await tile.scrollIntoViewIfNeeded();
    const box = (await tile.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 6 });
    await page.waitForTimeout(1200);

    // The video's own box must be the topmost thing at its centre: no overlay,
    // gradient or title strip sitting on the footage.
    //
    // Scoped to the tile's own video. A page-wide `querySelector('video')` now matches
    // the intro's hero clip, which is the first video in the document and has nothing
    // to do with this assertion.
    const tag = await tile.evaluate((el) => {
      const v = el.querySelector('video');
      if (!v) return 'no-video';
      const r = v.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return hit?.tagName.toLowerCase();
    });
    expect(tag, 'the tile preview never started, so this test proves nothing').not.toBe('no-video');
    expect(tag, 'something is layered over the playing clip').toBe('video');
  });

  test('is suppressed entirely under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const tile = page.getByRole('button').first();
    // The reel now sits below the intro, so the tile must be scrolled into view before
    // its box is in viewport coordinates the mouse can actually reach.
    await tile.scrollIntoViewIfNeeded();
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
      const u = r.url();
    // The intro's hero clip is a deliberate, budgeted exception; these assertions
    // are about the reel's full clips.
    if (u.endsWith('.mp4') && !u.endsWith('/hero.mp4')) videos.push(u);
    });
    await page.goto('/');
    const tile = page.getByRole('button').first();
    // The reel sits below the intro now, so the tile has to be scrolled into view before
    // the hover lands on it at all.
    await tile.scrollIntoViewIfNeeded();
    await tile.hover();
    await expect
      .poll(() => videos.length, { message: 'hovering never triggered a preview', timeout: 5000 })
      .toBeGreaterThan(0);
    for (const url of videos) expect(url).toMatch(/-preview\.mp4$/);
  });
});
