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

  test('the intro loads its own hero clip and nothing else', async ({ page }) => {
    const videos: string[] = [];
    page.on('request', (r) => {
      if (r.url().endsWith('.mp4')) videos.push(r.url());
    });

    await page.goto('/');
    await page.waitForTimeout(1500);

    // The hero deliberately plays one clip, so the old "zero video" rule no longer
    // holds. What still must hold is that none of the reel's 16 full clips are pulled
    // before anyone asks for them. That was always the real contract; the hero is a
    // single encode made for this purpose, budgeted separately.
    expect(videos.length, 'the hero clip did not load').toBeGreaterThan(0);
    for (const url of videos) {
      expect(url, `the intro fetched a non-hero video: ${url}`).toMatch(/\/hero\.mp4$/);
    }
  });

  test('the hero clip stays inside its bandwidth budget', async ({ page }) => {
    // It loads on every visit, so its weight is charged to every visitor. The budget is
    // deliberately generous: this footage is dense particles over a bright sky, close to
    // the worst case for H.264, and squeezing it into 260KB forced CRF 45 and looked it.
    // What this guards is accidental growth, not size for its own sake. The poster paints
    // first, so the clip streaming in behind it does not delay what anyone sees.
    let bytes = 0;
    page.on('response', async (r) => {
      if (r.url().endsWith('/hero.mp4')) {
        const len = r.headers()['content-length'];
        if (len) bytes = Number(len);
      }
    });
    await page.goto('/');
    await page.waitForTimeout(2000);
    expect(bytes, 'hero clip missing').toBeGreaterThan(0);
    expect(bytes / 1024, 'the hero clip has grown past its budget').toBeLessThan(7000);
    // A floor as well as a ceiling. The failure that produced this test was not the clip
    // getting too big, it was the budget loop silently stepping quality down to fit and
    // shipping something unwatchable. A hero that suddenly comes in tiny means that
    // happened again, so it should fail rather than look like a win.
    expect(bytes / 1024, 'the hero is suspiciously small, quality was likely degraded').toBeGreaterThan(4000);
  });

  test('the reel is reachable from the intro', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /see the work/i }).click();
    await page.waitForTimeout(1800);

    const tiles = page.getByRole('button');
    expect(await tiles.count()).toBeGreaterThan(5);
    await expect(tiles.first()).toBeVisible();
  });

  test('a scroll cue is present and disappears once you scroll', async ({ page }) => {
    await page.goto('/');
    const cue = page.getByTestId('scroll-cue');
    await expect(cue).toBeVisible();

    const opacityOf = () =>
      cue.evaluate((el) => Number(getComputedStyle(el.parentElement!).opacity));

    expect(await opacityOf(), 'the cue started hidden').toBeGreaterThan(0.5);

    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.5));
    await page.waitForTimeout(500);

    expect(
      await opacityOf(),
      'the cue is still telling people to scroll after they have scrolled',
    ).toBeLessThan(0.3);
  });

  test('the hero shows a still image instead of video under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const videos: string[] = [];
    page.on('request', (r) => {
      if (r.url().endsWith('.mp4')) videos.push(r.url());
    });

    await page.goto('/');
    await page.waitForTimeout(1500);

    // An autoplaying loop is the single most obvious thing to suppress for someone who
    // asked for reduced motion, and the poster frame carries the same impression.
    expect(videos, 'the hero clip autoplayed despite prefers-reduced-motion').toEqual([]);
    await expect(page.locator('h1')).toBeVisible();
  });

  // The sequence used to stop at 47% and nothing noticed, because every test here
  // checked that things *start* animating rather than that they *finish*. `useScroll`
  // was offset 'end start', which does not reach progress 1 until the section's bottom
  // edge reaches the top of the viewport, a full 100vh after the sticky child has
  // already been released. The clip crept to scale 0.985 instead of 1.06 and the hero
  // scrolled away still boxed with rounded corners. These two assert the end state at
  // the exact moment the pin lets go, which is the last frame anyone actually sees.
  test('the hero sequence completes before the pin releases', async ({ page }) => {
    await page.goto('/');
    const release = await page.evaluate(() => {
      const s = document.querySelector('[data-testid="intro"]') as HTMLElement;
      return s.offsetHeight - window.innerHeight;
    });
    await page.evaluate((y) => window.scrollTo(0, y), release);
    await page.waitForTimeout(700);

    const end = await page.evaluate(() => {
      const stage = document.querySelector('[data-testid="intro"] .sticky')!;
      const layers = [...stage.children] as HTMLElement[];
      const gradientEl = layers.find((el) =>
        getComputedStyle(el).backgroundImage.includes('gradient'),
      );
      return {
        scale: new DOMMatrix(getComputedStyle(layers[0]).transform).a,
        gradient: gradientEl ? Number(getComputedStyle(gradientEl).opacity) : null,
      };
    });

    // Designed to reach 1.06. Anything near 0.98 means the runway is mismapped again.
    expect(end.scale, 'the clip never reached full bleed before the hero scrolled away').toBeGreaterThan(1.04);
    // This layer exists only to keep the wordmark legible over the footage. The wordmark
    // is long gone by now, so leaving it up just blacks out a third of the effect, which
    // is exactly what it did for the entire life of the original implementation.
    expect(end.gradient, 'the text-protection gradient never lifted').toBeLessThan(0.05);
  });

  test('the reel arrives as the hero releases, with no empty screen between', async ({ page }) => {
    await page.goto('/');
    const gap = await page.evaluate(() => {
      const intro = document.querySelector('[data-testid="intro"]') as HTMLElement;
      const work = document.getElementById('work')!;
      const release = intro.offsetHeight - window.innerHeight;
      const workTop = work.getBoundingClientRect().top + window.scrollY;
      return workTop - release;
    });
    // A pinned section leaves a trailing block the height of its sticky child. Left in,
    // it reads as a full blank screen between the hero and the reel. The negative margin
    // on #work cancels it, so the reel should begin essentially where the pin ends.
    expect(gap, `there is a ${Math.round(gap)}px dead zone after the hero`).toBeLessThan(200);
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
