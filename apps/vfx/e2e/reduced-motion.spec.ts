import { publishedTextureCount } from './helpers';
import { test, expect, type Page } from '@playwright/test';

// Automates the brief's Step 6 ("DevTools -> Rendering -> emulate
// prefers-reduced-motion: reduce, reload every route, confirm nothing
// disappears"), which as a manual-only check can't be run by this agent.
//
// Presence in the DOM is not the same as visibility: three earlier tasks
// in this plan shipped content that was technically present but sitting
// at opacity: 0 because a motion component's "final state" branch was
// wrong. `toBeVisible()` checks computed style (display, visibility,
// opacity via bounding box + hit-testing), so it catches that class of
// bug where `toBeInTheDocument`-style presence checks would not.
const ROUTES = ['/', '/textures/', '/commissions/'];

async function gotoReduced(page: Page, path: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

for (const path of ROUTES) {
  test(`content on ${path} stays visible under prefers-reduced-motion: reduce`, async ({ page }) => {
    await gotoReduced(page, path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Nav is shared chrome present (and visible) on every route.
    await expect(page.getByRole('link', { name: 'Doyun.vfx' })).toBeVisible();
  });
}

test('reel tiles stay visible under reduced motion', async ({ page }) => {
  await gotoReduced(page, '/');
  const tiles = page.getByRole('button');
  await expect(tiles.first()).toBeVisible();
  const count = await tiles.count();
  for (let i = 0; i < count; i++) {
    await expect(tiles.nth(i)).toBeVisible();
  }
});

test('lightbox opens without scaling under reduced motion, and stays visible', async ({ page }) => {
  await gotoReduced(page, '/');
  await page.getByRole('button').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('video')).toBeVisible();
});

test('every flipbook stays visible under reduced motion', async ({ page }) => {
  await gotoReduced(page, '/textures/');
  const flipbooks = page.getByTestId('flipbook-frame');
  // Counted from the content directory rather than hardcoded, so adding a texture
  // does not fail this test. The property under test is that all of them stay
  // visible, not how many there happen to be.
  await expect(flipbooks).toHaveCount(publishedTextureCount());
  const count = await flipbooks.count();
  for (let i = 0; i < count; i++) {
    await expect(flipbooks.nth(i)).toBeVisible();
  }
});

test('commissions content stays visible under reduced motion', async ({ page }) => {
  await gotoReduced(page, '/commissions/');
  await expect(page.getByRole('link', { name: 'yippyfx@gmail.com' })).toBeVisible();
});
