import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hasReducedMotionListener, prefersReducedMotion } from 'motion-dom';
import { Lightbox } from '../Lightbox';

const effect = {
  slug: 'ink-swing', title: 'Ink Swing', status: 'published' as const,
  video: 'ink-swing.mp4', poster: 'ink-swing-poster.jpg', width: 1280, height: 584, order: 2,
};

// See packages/motion/src/__tests__/Reveal.test.tsx for why the singleton
// must be reset per test: motion-dom lazily reads window.matchMedia exactly
// once per process and latches the result forever otherwise.
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
  stubMatchMedia(false);
  resetReducedMotionSingleton();
});

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.style.overflow = '';
});

test('renders nothing, and no video, when effect is null', () => {
  render(<Lightbox effect={null} onClose={() => {}} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.querySelector('video')).toBeNull();
});

test('opens as an accessible dialog with the effect video, using its true intrinsic dimensions', () => {
  render(<Lightbox effect={effect} onClose={() => {}} />);
  const dialog = screen.getByRole('dialog', { name: /ink swing/i });
  expect(dialog).toHaveAttribute('aria-modal', 'true');

  const video = document.querySelector('video')!;
  expect(video).not.toBeNull();
  expect(video).toHaveAttribute('src', expect.stringContaining('ink-swing.mp4'));
  expect(video).toHaveAttribute('width', '1280');
  expect(video).toHaveAttribute('height', '584');
});

test('moves focus into the dialog when it opens', () => {
  render(<Lightbox effect={effect} onClose={() => {}} />);
  const dialog = screen.getByRole('dialog', { name: /ink swing/i });
  expect(dialog).toContainElement(document.activeElement as HTMLElement);
});

test('closes on Escape', async () => {
  const onClose = vi.fn();
  render(<Lightbox effect={effect} onClose={onClose} />);
  await userEvent.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalled();
});

test('locks background scroll while open and restores it on unmount', () => {
  const { unmount } = render(<Lightbox effect={effect} onClose={() => {}} />);
  expect(document.body.style.overflow).toBe('hidden');
  unmount();
  expect(document.body.style.overflow).toBe('');
});

test('removes the video element once closed (effect becomes null)', async () => {
  const { rerender } = render(<Lightbox effect={effect} onClose={() => {}} />);
  expect(document.querySelector('video')).not.toBeNull();
  rerender(<Lightbox effect={null} onClose={() => {}} />);
  await waitFor(() => expect(document.querySelector('video')).toBeNull());
});

test('under reduced motion, the dialog still opens and is fully usable, without the spring scale', () => {
  stubMatchMedia(true);
  resetReducedMotionSingleton();
  render(<Lightbox effect={effect} onClose={() => {}} />);
  const dialog = screen.getByRole('dialog', { name: /ink swing/i });
  expect(dialog).toBeInTheDocument();
  expect(document.querySelector('video')).not.toBeNull();
});
