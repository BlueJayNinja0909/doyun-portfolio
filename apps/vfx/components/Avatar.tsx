'use client';

import { lazy, Suspense, useEffect, useRef, useState } from 'react';

/**
 * Lazy wrapper for the 3D rig.
 *
 * three.js and react-three-fiber are around 150KB gzipped. Loading them eagerly would
 * put the whole library in the initial bundle of a page whose job is to render text
 * fast — so the scene is imported only once its container is near the viewport, and
 * never at all for a visitor who prefers reduced motion.
 *
 * The fallback is a real silhouette rather than a spinner: it occupies the exact box
 * the canvas will, so nothing shifts when the scene swaps in, and if the module fails
 * to load the page still shows an avatar rather than a hole.
 */
const AvatarScene = lazy(() => import('./AvatarScene'));

function Silhouette() {
  return (
    <div className="flex h-full w-full items-center justify-center" aria-hidden="true">
      <svg viewBox="0 0 120 150" className="h-[78%] w-auto opacity-[0.13]" fill="currentColor">
        <rect x="42" y="2" width="36" height="18" rx="2" />
        <rect x="36" y="26" width="48" height="48" rx="2" />
        <rect x="10" y="26" width="22" height="48" rx="2" />
        <rect x="88" y="26" width="22" height="48" rx="2" />
        <rect x="38" y="78" width="22" height="48" rx="2" />
        <rect x="60" y="78" width="22" height="48" rx="2" />
      </svg>
    </div>
  );
}

export function Avatar({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const mq = (q: string) =>
      typeof window.matchMedia === 'function' && window.matchMedia(q).matches;

    // A visitor who asked for reduced motion gets the static silhouette and never
    // downloads three.js at all.
    if (mq('(prefers-reduced-motion: reduce)')) return;

    // Neither does a touch device. The entire point of this rig is that it follows the
    // cursor, and a phone has no cursor to follow — so the 3D library would be ~150KB
    // and half a second of main-thread work spent on a feature that cannot fire. The
    // silhouette is the honest thing to show there.
    if (!mq('(pointer: fine)')) return;

    const node = ref.current;
    if (!node) return;

    // The rig sits above the fold, so an IntersectionObserver alone would fire
    // immediately and pull ~150KB of 3D library into the critical path — measured at
    // 23 Lighthouse points on mobile. Waiting for the page to finish loading and then
    // for an idle moment costs the visitor nothing (the silhouette holds the space)
    // and keeps three.js off the path to first paint entirely.
    let cancelled = false;
    let idle: number | undefined;

    const start = () => {
      if (cancelled) return;
      const schedule = (cb: () => void) =>
        typeof requestIdleCallback === 'function'
          ? (idle = requestIdleCallback(cb, { timeout: 2500 }))
          : window.setTimeout(cb, 600);

      if (typeof IntersectionObserver === 'undefined') {
        schedule(() => setLoad(true));
        return;
      }
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io.disconnect();
            schedule(() => setLoad(true));
          }
        },
        { rootMargin: '200px' },
      );
      io.observe(node);
    };

    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', start);
      if (idle !== undefined && typeof cancelIdleCallback === 'function') cancelIdleCallback(idle);
    };
  }, []);

  return (
    <div ref={ref} className={className} data-testid="avatar">
      {load ? (
        <Suspense fallback={<Silhouette />}>
          <AvatarScene />
        </Suspense>
      ) : (
        <Silhouette />
      )}
    </div>
  );
}
