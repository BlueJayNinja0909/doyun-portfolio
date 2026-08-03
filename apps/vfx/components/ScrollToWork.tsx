'use client';

import { useCallback, type ReactNode } from 'react';

/**
 * A link that scrolls to its target on an eased curve rather than jumping.
 *
 * `href="#work"` alone is an instant jump — no animation, which is why clicking the
 * button appeared to do nothing cinematic. `scroll-behavior: smooth` would animate it,
 * but the browser picks the duration (typically ~300ms) and it is far too quick to read
 * as anything. Driving it here means the scroll can take long enough for the reel's
 * perspective tilt to actually play out as you travel.
 *
 * The href stays real, so this works without JavaScript and is still a proper link:
 * middle-click, open-in-new-tab and keyboard activation all behave normally.
 */

/** Long enough to feel deliberate, short enough not to feel like it's stuck. */
const DURATION_MS = 1500;

/** Ease-in-out cubic: slow departure, quick middle, gentle arrival. */
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export function ScrollToWork({
  targetId,
  children,
  className,
}: {
  targetId: string;
  children: ReactNode;
  className?: string;
}) {
  const onClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Let the browser handle modified clicks — ctrl/cmd/middle-click should open a
      // tab, not animate this one.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

      const target = document.getElementById(targetId);
      if (!target) return;

      e.preventDefault();

      const reduced =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const start = window.scrollY;
      const end = target.getBoundingClientRect().top + start;
      const distance = end - start;

      if (reduced || Math.abs(distance) < 8) {
        window.scrollTo(0, end);
        return;
      }

      const t0 = performance.now();
      let cancelled = false;

      // Any manual scroll during the animation hands control straight back. Fighting a
      // user for the scroll position is the single most irritating thing a page can do.
      const abort = () => {
        cancelled = true;
      };
      window.addEventListener('wheel', abort, { passive: true, once: true });
      window.addEventListener('touchstart', abort, { passive: true, once: true });
      window.addEventListener('keydown', abort, { once: true });

      const step = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - t0) / DURATION_MS);
        window.scrollTo(0, start + distance * ease(t));
        if (t < 1) requestAnimationFrame(step);
        else {
          window.removeEventListener('wheel', abort);
          window.removeEventListener('touchstart', abort);
          window.removeEventListener('keydown', abort);
          // Move focus so a keyboard user actually lands in the section, not just the
          // viewport. Without this, tabbing after the scroll resumes from the button.
          target.setAttribute('tabindex', '-1');
          target.focus({ preventScroll: true });
        }
      };
      requestAnimationFrame(step);
    },
    [targetId],
  );

  return (
    <a href={`#${targetId}`} onClick={onClick} className={className}>
      {children}
    </a>
  );
}
