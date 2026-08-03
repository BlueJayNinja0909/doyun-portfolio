import { render, screen } from '@testing-library/react';
import { Flipbook } from '../Flipbook';

const texture = {
  slug: 'dissipate-01', title: 'Dissipation', status: 'published' as const,
  source: 'flipbook-11.webp', grid: { cols: 4, rows: 6, frames: 21 }, fps: 24,
};

test('exposes the sheet as an image with an accessible name', () => {
  render(<Flipbook texture={texture} src="/textures/flipbook-11.webp" />);
  expect(screen.getByRole('img', { name: /dissipation/i })).toBeInTheDocument();
});

test('sets background-size from the grid', () => {
  render(<Flipbook texture={texture} src="/textures/flipbook-11.webp" />);
  const el = screen.getByTestId('flipbook-frame');
  expect(el).toHaveStyle({ backgroundSize: '400% 600%' });
});

test('is keyboard focusable so hover-only playback is not the sole affordance', () => {
  render(<Flipbook texture={texture} src="/textures/flipbook-11.webp" />);
  expect(screen.getByRole('img', { name: /dissipation/i })).toHaveAttribute('tabindex', '0');
});

test('under reduced motion, the contact sheet stays visible and no animation runs', () => {
  const { container } = render(<Flipbook texture={texture} src="/textures/flipbook-11.webp" />);
  const el = screen.getByTestId('flipbook-frame');

  // The sheet itself must remain visible unconditionally — reduced motion
  // must not hide it, only stop it from stepping through frames.
  expect(el.style.backgroundImage).toContain('flipbook-11.webp');
  expect(el).not.toHaveStyle({ display: 'none', visibility: 'hidden', opacity: '0' });

  // jsdom parses <style> tags into a real CSSOM (CSSMediaRule, CSSStyleRule,
  // CSSKeyframesRule), so we can assert on the actual cascade rather than on
  // string presence: the `animation` declaration must live *only* inside
  // `@media (prefers-reduced-motion: no-preference)`. A browser evaluating
  // this stylesheet under `prefers-reduced-motion: reduce` drops that whole
  // block, so if `animation` ever leaked outside it (or the media guard were
  // removed), this is what would go red.
  const styleEl = container.querySelector('style');
  expect(styleEl).not.toBeNull();
  const sheet = styleEl!.sheet!;
  const rules = Array.from(sheet.cssRules);

  const mediaRule = rules.find(
    (r): r is CSSMediaRule => r instanceof CSSMediaRule && r.media.mediaText.includes('prefers-reduced-motion: no-preference'),
  );
  expect(mediaRule).toBeDefined();
  const rulesInsideMedia = Array.from(mediaRule!.cssRules);
  expect(rulesInsideMedia.some((r) => r.cssText.includes('animation'))).toBe(true);

  // No rule outside that media block — including the base selector rule and
  // the @keyframes definitions themselves — may declare `animation` on the
  // element. (@keyframes rules define keyframe steps, not an `animation`
  // property, so this also guards against someone hoisting the shorthand out
  // of the media guard by mistake.)
  const rulesOutsideMedia = rules.filter((r) => r !== mediaRule);
  expect(rulesOutsideMedia.every((r) => !r.cssText.includes('animation:'))).toBe(true);
});

test('Y row-advance duration stays locked to the X row duration on a trimmed grid (frames < cols * rows)', () => {
  // Regression guard for the bug where the Y animation was timed off
  // `frames / fps` instead of the full grid `(cols * rows) / fps`. This
  // texture's grid (4 cols x 6 rows, 21 frames) is trimmed — exactly the
  // shape that exposed the drift — so this test would have failed against
  // the old formula (totalDuration = 21/24 = 0.875s => per-row = 0.14583s,
  // vs the correct per-row lock of 4/24 = 0.16667s).
  const { container } = render(<Flipbook texture={texture} src="/textures/flipbook-11.webp" />);
  const css = container.querySelector('style')!.textContent!;

  const match = css.match(
    /sprite-x-\S+\s+([\d.]+)s steps\((\d+)\)[^,]*,\s*sprite-y-\S+\s+([\d.]+)s steps\((\d+)\)/,
  );
  expect(match).not.toBeNull();
  const [, xDuration, , yDuration, yRows] = match!;

  const rowDurationFromX = Number(xDuration);
  const rowDurationFromY = Number(yDuration) / Number(yRows);

  // The Y animation must advance exactly one row every time X completes one
  // full row cycle — i.e. the Y animation's total duration divided by its
  // step count must equal the X animation's duration.
  expect(rowDurationFromY).toBeCloseTo(rowDurationFromX, 10);
});
