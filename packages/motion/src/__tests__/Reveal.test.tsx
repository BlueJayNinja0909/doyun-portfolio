import { render, screen } from '@testing-library/react';
import { Reveal } from '../Reveal';

beforeEach(() => {
  // jsdom has no IntersectionObserver
  class IO {
    constructor(private cb: IntersectionObserverCallback) {}
    observe() { this.cb([{ isIntersecting: true } as IntersectionObserverEntry], this as never); }
    disconnect() {}
    unobserve() {}
  }
  vi.stubGlobal('IntersectionObserver', IO);
});

test('renders children', () => {
  render(<Reveal><p>visible content</p></Reveal>);
  expect(screen.getByText('visible content')).toBeInTheDocument();
});

test('children stay in the DOM when reduced motion is preferred', () => {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: q.includes('reduce'), media: q,
    addEventListener() {}, removeEventListener() {},
  }));
  render(<Reveal><p>still here</p></Reveal>);
  expect(screen.getByText('still here')).toBeInTheDocument();
});
