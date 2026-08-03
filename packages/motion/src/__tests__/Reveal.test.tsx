import { render, screen } from '@testing-library/react';
import { hasReducedMotionListener, prefersReducedMotion } from 'motion-dom';
import { Reveal } from '../Reveal';

// motion-dom's useReducedMotion() lazily initialises a module-level
// singleton (`prefersReducedMotion`, `hasReducedMotionListener`) exactly
// once per process — on the *first* render that calls it, reading
// `window.matchMedia` at that moment and then latching forever. If two
// tests in this file rendered `<Reveal>` against different `matchMedia`
// stubs, whichever test ran first would permanently decide the value for
// both, and the second test's stub would be silently ignored (this is not
// hypothetical — it happened here). `vi.resetModules()` does not help:
// motion-dom is resolved as an external dependency and keeps its own
// module cache outside Vitest's registry. So each test resets the
// singleton directly before rendering, guaranteeing it re-reads whichever
// `matchMedia` stub is active *for that test*, regardless of run order.
function stubMatchMedia(reduced: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduced && query.includes('reduce'),
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

function resetReducedMotionSingleton() {
  hasReducedMotionListener.current = false;
  prefersReducedMotion.current = null;
}

beforeEach(() => {
  // jsdom has no IntersectionObserver
  class IO {
    constructor(private cb: IntersectionObserverCallback) {}
    observe() { this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as never); }
    disconnect() {}
    unobserve() {}
  }
  vi.stubGlobal('IntersectionObserver', IO);
  resetReducedMotionSingleton();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test('renders children', () => {
  stubMatchMedia(false);

  render(<Reveal><p>visible content</p></Reveal>);
  expect(screen.getByText('visible content')).toBeInTheDocument();
});

test('children stay visible in the DOM when reduced motion is preferred', () => {
  stubMatchMedia(true);

  render(<Reveal><p>still here</p></Reveal>);
  const content = screen.getByText('still here');

  // Presence alone isn't enough — a component stuck at its animated
  // `initial` state (opacity: 0, translated off-position) is still "in
  // the document" but invisible to the user. Reduced motion must render
  // the *final*, fully visible state, not a hidden one.
  expect(content).toBeInTheDocument();
  expect(content.parentElement).not.toHaveStyle({ opacity: '0' });
  expect(content.parentElement).not.toHaveStyle({ transform: 'translateY(16px)' });
});
