import { test, expect, type Page } from '@playwright/test';
import sharp from 'sharp';

// --- The gap this file closes -------------------------------------------
//
// 53 unit and 16 E2E tests were green while the site rendered white text on
// a white background, because Playwright's default `colorScheme` is
// `light` and every existing assertion checked layout/hit-testing
// (`toBeVisible()`), never contrast. This file's assertions run under BOTH
// `light-os` and `dark-os` Playwright projects (see playwright.config.ts) —
// the site is unconditionally dark and must render identically regardless
// of the visitor's OS preference.

const ROUTES = ['/', '/textures/', '/commissions/'];

/**
 * WCAG contrast ratio between an element's computed text colour and the
 * nearest ancestor's opaque computed background colour (falling back to
 * the browser's default white canvas, matching how an un-styled page
 * actually paints). This is a computed-style check, not a rasterized
 * glyph check, so it directly targets the `:root { --background: #fff }` /
 * `body { color: var(--foreground) }` class of bug: a body-level colour
 * regression shows up here even though `toBeVisible()` never catches it.
 */
async function contrastRatio(page: Page, selector: string): Promise<number> {
  return page.evaluate((sel) => {
    // Tailwind v4's default palette (and opacity modifiers like
    // `text-white/45`) can make getComputedStyle().color come back as
    // `oklab(...)` rather than `rgb(...)`, and modern Chromium accepts
    // that syntax as a canvas fillStyle without converting it back to rgb
    // on read — so a fillStyle round-trip alone doesn't normalize it.
    // Actually painting a 1x1 rect and reading the composited pixel back
    // via getImageData does: that path always resolves to concrete RGBA
    // bytes regardless of which CSS colour syntax produced them. Alpha is
    // pre-multiplied into the painted pixel here (painted over an opaque
    // white backing rect first), so we read `a` from the source colour
    // string separately via a second paint over black and comparing.
    const probe = document.createElement('canvas');
    probe.width = 1;
    probe.height = 1;
    const ctx = probe.getContext('2d', { willReadFrequently: true })!;
    function parseColor(str: string) {
      ctx.clearRect(0, 0, 1, 1);
      // Paint over white, then over black, and back out straight alpha +
      // unpremultiplied colour from the two composited samples: for a
      // source colour (r,g,b,a), compositing over backing colour B gives
      // observed = a*c + (1-a)*B. With B=255 and B=0 respectively:
      //   overWhite = a*c + (1-a)*255
      //   overBlack = a*c
      // => a = 1 - (overWhite - overBlack) / 255, and c = overBlack / a.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = str;
      ctx.fillRect(0, 0, 1, 1);
      const overWhite = ctx.getImageData(0, 0, 1, 1).data;

      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1, 1);
      ctx.fillStyle = str;
      ctx.fillRect(0, 0, 1, 1);
      const overBlack = ctx.getImageData(0, 0, 1, 1).data;

      const a = 1 - (overWhite[0] - overBlack[0]) / 255;
      if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 };
      const r = overBlack[0] / a;
      const g = overBlack[1] / a;
      const b = overBlack[2] / a;
      return { r, g, b, a };
    }
    function relLum({ r, g, b }: { r: number; g: number; b: number }) {
      const [rs, gs, bs] = [r, g, b].map((v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }
    type RGBA = { r: number; g: number; b: number; a: number };
    /** Source-over: what `src` looks like painted on `dst`. */
    const over = (src: RGBA, dst: RGBA): RGBA => ({
      r: src.a * src.r + (1 - src.a) * dst.r,
      g: src.a * src.g + (1 - src.a) * dst.g,
      b: src.a * src.b + (1 - src.a) * dst.b,
      a: 1,
    });

    const el = document.querySelector(sel);
    if (!el) throw new Error(`selector not found: ${sel}`);
    const textColor = parseColor(getComputedStyle(el).color);
    if (!textColor) throw new Error('could not parse text color');

    // Composite the whole background stack rather than stopping at the first layer with
    // any alpha at all.
    //
    // The previous version took that first layer and fed its *unpremultiplied* rgb
    // straight into the luminance maths, discarding the alpha. A translucent white
    // background therefore measured as pure white: `white/0.06` over near-black scored
    // as #ffffff, and against `white/0.75` text that produced a contrast ratio of 1.0
    // for an element that actually renders around 10:1. It went unnoticed because
    // nothing being tested had a translucent background of its own until the nav pills
    // gained one, so the walk always reached an opaque ancestor on the first hit.
    const layers: RGBA[] = [];
    let node: Element | null = el;
    while (node) {
      const c = parseColor(getComputedStyle(node).backgroundColor);
      if (c && c.a > 0) {
        layers.push(c);
        if (c.a >= 1) break;
      }
      node = node.parentElement;
    }

    // Innermost first above, so the last entry is the outermost. An opaque layer ends
    // the walk and becomes the base; if none was found, the canvas underneath is white.
    let bgColor: RGBA =
      layers.length > 0 && layers[layers.length - 1].a >= 1
        ? layers.pop()!
        : { r: 255, g: 255, b: 255, a: 1 };
    // Paint what remains back on, outermost first, to land on what the eye sees.
    for (let i = layers.length - 1; i >= 0; i--) bgColor = over(layers[i], bgColor);

    // Text alpha matters for the same reason the background's does.
    const L1 = relLum(over(textColor, bgColor));
    const L2 = relLum(bgColor);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
  }, selector);
}

for (const path of ROUTES) {
  test(`h1 has real contrast against its background on ${path}`, async ({ page }) => {
    await page.goto(path);
    const ratio = await contrastRatio(page, 'h1');
    // WCAG AA for large text (h1 here is 3rem+) is 3:1; we assert well
    // above that so a near-miss regression still fails loudly.
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });
}

test('nav links have real contrast against their background', async ({ page }) => {
  await page.goto('/');
  const ratio = await contrastRatio(page, 'nav a');
  // Nav text is deliberately dim (text-white/45) against the dark ground,
  // so its ratio is lower than the h1's — but it must still clear AA for
  // normal-size text (4.5:1), not the near-zero ratio white-on-white gave.
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});

test('the ambient backdrop contributes visible, non-flat pixels', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const buffer = await page.screenshot();
  const image = sharp(buffer);
  const meta = await image.metadata();
  const width = meta.width ?? 1280;
  const height = meta.height ?? 800;

  // .ambient's violet radial gradient is centred at 20% x / 0% y of the
  // viewport, and the ambient.webp texture + pink gradient add further
  // variation elsewhere. Sample a wide band across the top of the page —
  // inside the nav bar, which paints no background of its own — and check
  // two things that together rule out both failure directions:
  //  1. The band is dark-toned overall (rules out an opaque *light* body
  //     background sitting on top of .ambient — the original Critical 1).
  //  2. The band has real pixel-to-pixel variance (rules out .ambient
  //     being hidden behind ANY opaque flat body background, whether or
  //     not it happens to match the #050507 ground colour exactly — a
  //     single solid colour, dark or light, has ~zero variance; a
  //     composited texture + two radial gradients does not).
  // Kept above the nav's text baseline (nav has ~20px of top padding
  // before any glyphs render) so anti-aliased text edges can't supply
  // false variance — only .ambient's own texture/gradients can.
  const band = { left: 0, top: 0, width, height: Math.max(8, Math.round(height * 0.015)) };
  const patch = await image.extract(band).raw().toBuffer();

  let sum = 0;
  let min = 255;
  let max = 0;
  const pixelCount = patch.length / 3;
  for (let i = 0; i < patch.length; i += 3) {
    const [r, g, b] = [patch[i], patch[i + 1], patch[i + 2]];
    const lum = (r + g + b) / 3;
    sum += lum;
    if (lum < min) min = lum;
    if (lum > max) max = lum;
  }
  const avg = sum / pixelCount;
  const range = max - min;

  expect(avg, `expected a dark band across the top of the page, sampled average luminance ${avg.toFixed(1)}`).toBeLessThan(60);
  expect(
    range,
    `expected visible variance from the ambient texture/gradients across the sampled band, got a near-uniform range of ${range.toFixed(1)}`,
  ).toBeGreaterThan(10);
});

// --- Cheap coverage-gap fill-ins -----------------------------------------
//
// The zero-.mp4-on-load contract was previously only asserted on `/`.
// The contract is stated site-wide, so guard the other two routes too.
for (const path of ['/textures/', '/commissions/']) {
  test(`no .mp4 is fetched loading ${path}`, async ({ page }) => {
    const videoRequests: string[] = [];
    page.on('request', (r) => {
      if (r.url().endsWith('.mp4')) videoRequests.push(r.url());
    });
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    expect(videoRequests).toEqual([]);
  });
}

// Content-integrity guard, extended site-wide (previously only the
// commissions page had a rendered-text assertion, for the phone-number
// regex). No fabricated credits/pricing, and the phone-number guard now
// applies everywhere, not just where a phone number would most obviously
// show up.
for (const path of ROUTES) {
  test(`no phone number or pricing text renders on ${path}`, async ({ page }) => {
    await page.goto(path);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText).not.toMatch(/(\d[\s.-]?){7,}/);
    expect(bodyText.toLowerCase()).not.toMatch(/\$\d|per hour|per effect|starting at/);
  });
}
