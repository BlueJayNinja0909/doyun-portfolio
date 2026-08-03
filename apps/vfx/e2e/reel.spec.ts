import { test, expect } from '@playwright/test';

// --- The performance contract -------------------------------------------
//
// The reel grid renders poster images only; each clip's 9.3 MB .mp4 must
// stay unfetched until its tile is clicked. This is the single most
// important guarantee this site makes, so it gets its own test rather than
// being folded into a broader "page loads" assertion. If someone later
// swaps a poster <img> for an eagerly-rendered/autoplaying <video>, this
// test — and only this test, specifically because it inspects network
// requests rather than the DOM — will fail.
test('reel loads without fetching any video', async ({ page }) => {
  const videoRequests: string[] = [];
  page.on('request', (r) => {
    if (r.url().endsWith('.mp4')) videoRequests.push(r.url());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // Give any (incorrect) eager video request a moment to fire before we
  // assert against the log — networkidle already waits for in-flight
  // requests to settle, but goto() alone can race a late request.
  await page.waitForLoadState('networkidle');
  expect(videoRequests).toEqual([]);
});

test('clicking a tile opens the lightbox and loads that clip', async ({ page }) => {
  const videoRequests: { url: string; status: number }[] = [];
  page.on('response', (r) => {
    if (r.url().endsWith('.mp4')) videoRequests.push({ url: r.url(), status: r.status() });
  });

  await page.goto('/');
  const firstTile = page.getByRole('button').first();
  await firstTile.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('video')).toHaveCount(1);

  // The clip should now be requested — and browsers fetch <video> via
  // range requests (206 Partial Content), not a plain 200, since the
  // element only needs enough of the file to start playback/seek.
  await expect.poll(() => videoRequests.length).toBeGreaterThan(0);
  expect(videoRequests.some((r) => r.status === 206 || r.status === 200)).toBe(true);
});

test('escape closes the lightbox and returns focus to the invoking tile', async ({ page }) => {
  await page.goto('/');
  const firstTile = page.getByRole('button').first();
  await firstTile.click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Focus must return to the tile that opened the dialog, not <body> —
  // otherwise a keyboard user loses their place in the grid every time
  // they close a clip.
  await expect(firstTile).toBeFocused();
});

test('body scroll is restored after the lightbox closes', async ({ page }) => {
  await page.goto('/');
  const overflowBefore = await page.evaluate(() => document.body.style.overflow);

  await page.getByRole('button').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const overflowOpen = await page.evaluate(() => document.body.style.overflow);
  expect(overflowOpen).toBe('hidden');

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const overflowAfter = await page.evaluate(() => document.body.style.overflow);
  expect(overflowAfter).toBe(overflowBefore);
});

test('focus trap keeps Tab cycling inside the open dialog', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();

  // Close button receives focus on open (see Lightbox.tsx). Shift+Tab from
  // there must wrap to the last focusable element inside the dialog, not
  // escape to the page behind it.
  const active = await page.evaluate(() => document.activeElement?.tagName);
  expect(active).toBeTruthy();

  await page.keyboard.press('Shift+Tab');
  const afterShiftTab = await page.evaluate(() =>
    document.activeElement ? document.querySelector('[role="dialog"]')?.contains(document.activeElement) : false
  );
  expect(afterShiftTab).toBe(true);
});

test('no console errors on any route', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  for (const path of ['/', '/textures/', '/commissions/']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  expect(errors).toEqual([]);
});

test('textures page renders nine flipbooks', async ({ page }) => {
  await page.goto('/textures/');
  const flipbooks = page.getByTestId('flipbook-frame');
  await expect(flipbooks).toHaveCount(9);
});

test('commissions page shows the contact email and no phone number', async ({ page }) => {
  await page.goto('/commissions/');
  await expect(page.getByRole('link', { name: 'yippyfx@gmail.com' })).toBeVisible();
  const bodyText = await page.evaluate(() => document.body.innerText);
  // A crude but effective guard against a personal phone number ever
  // being added to the page: no run of 7+ digits (allowing common
  // separators) should appear anywhere in the rendered text.
  expect(bodyText).not.toMatch(/(\d[\s.-]?){7,}/);
});
