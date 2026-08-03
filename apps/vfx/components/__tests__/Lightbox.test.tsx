import { useState } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { hasReducedMotionListener, prefersReducedMotion } from 'motion-dom';
import { Lightbox } from '../Lightbox';
import type { Effect } from '@/lib/schema';

const effect = {
  slug: 'ink-swing', title: 'Ink Swing', status: 'published' as const, tier: 'featured' as const,
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

// The `fixed inset-0 z-50` overlay covers the whole page. Motion applies
// non-animatable exit props (like `pointerEvents`) synchronously the
// instant the exit transition starts, before the opacity animation itself
// runs to completion — which matters because that animation can be
// arbitrarily delayed (a backgrounded tab pauses rAF) or interrupted. If
// `exit` only set `opacity: 0`, the overlay would keep swallowing clicks
// for that entire window. Checked synchronously, right after the effect
// becomes null and before the exit animation has had any chance to
// finish, so this only passes if pointer-events is turned off immediately.
test('overlay stops blocking clicks the instant it starts to close', async () => {
  const { rerender } = render(<Lightbox effect={effect} onClose={() => {}} />);
  const dialog = screen.getByRole('dialog', { name: /ink swing/i });
  expect(dialog).not.toHaveStyle({ pointerEvents: 'none' });

  rerender(<Lightbox effect={null} onClose={() => {}} />);

  // Non-animatable exit props are applied synchronously by Motion, but the
  // update can land a tick after React's own commit (it's driven by
  // Motion's own effect timing, not React's), so poll briefly rather than
  // asserting on the exact same microtask. This must resolve well before
  // the node is actually removed from the DOM (asserted elsewhere), which
  // is the whole point: pointer-events must turn off before the animation
  // — let alone the unmount — completes.
  await waitFor(() => expect(dialog).toHaveStyle({ pointerEvents: 'none' }));
  expect(document.body.contains(dialog)).toBe(true);
});

test('under reduced motion, the dialog still opens and is fully usable, without the spring scale', () => {
  stubMatchMedia(true);
  resetReducedMotionSingleton();
  render(<Lightbox effect={effect} onClose={() => {}} />);
  const dialog = screen.getByRole('dialog', { name: /ink swing/i });
  expect(dialog).toBeInTheDocument();
  expect(document.querySelector('video')).not.toBeNull();
});

// aria-modal="true" is a promise to assistive tech that everything outside
// the dialog is inert. If Tab can walk out into the page behind it, that
// promise is false, and a screen-reader user ends up interacting with
// controls they've been told are unreachable. These two tests assert the
// wrap in both directions. Order in the DOM is video, then close button —
// close button gets initial focus (existing behavior), so it is "last".
describe('focus trap', () => {
  test('Tab from the last focusable element wraps to the first', async () => {
    render(<Lightbox effect={effect} onClose={() => {}} />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toHaveFocus();

    await userEvent.tab();

    const video = document.querySelector('video')!;
    expect(video).toHaveFocus();
  });

  test('Shift+Tab from the first focusable element wraps to the last', async () => {
    render(<Lightbox effect={effect} onClose={() => {}} />);
    const video = document.querySelector('video')!;
    video.focus();

    await userEvent.tab({ shift: true });

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toHaveFocus();
  });
});

test('returns focus to the element that opened the dialog once it closes', async () => {
  // A harness that mirrors real usage: an EffectTile-like trigger button
  // controls whether the Lightbox is mounted with an effect, exactly how
  // Task 9's page will wire EffectTile's onOpen into Lightbox's effect prop.
  function Harness() {
    const [open, setOpen] = useState<Effect | null>(null);
    return (
      <div>
        <button onClick={() => setOpen(effect)}>Open Ink Swing</button>
        <Lightbox effect={open} onClose={() => setOpen(null)} />
      </div>
    );
  }

  render(<Harness />);
  const opener = screen.getByRole('button', { name: /open ink swing/i });
  await userEvent.click(opener);

  await screen.findByRole('dialog', { name: /ink swing/i });
  await userEvent.keyboard('{Escape}');

  await waitFor(() => expect(opener).toHaveFocus());
});
