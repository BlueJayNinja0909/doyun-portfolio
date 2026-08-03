'use client';

import { useCallback, useEffect, useRef } from 'react';

/**
 * Doyun's actual Roblox avatar, rendered from Roblox's public thumbnail endpoint
 * (user 569624262) and served from this site rather than hot-linked.
 *
 * This replaced a procedural R6 rig built from boxes. The rig was accurate for a plain
 * dummy but could never be *his* avatar — layered hoodie, hair, horned hat, katanas and
 * a waist aura are not reproducible from primitives, and pretending otherwise would
 * have shipped a generic noob on a portfolio whose whole point is craft.
 *
 * Roblox's 3D-avatar endpoint returns a real mesh but now requires account
 * authentication, which is not a credential worth handling for a decorative hero. The
 * 2D render is public, exact, and 20KB — against roughly 150KB of three.js for the
 * approximation. Dropping the 3D library also means touch devices get the avatar
 * instead of a fallback silhouette.
 *
 * The trade is that a flat render cannot turn its head. It tilts and parallaxes toward
 * the cursor instead, which reads as responsiveness without pretending to be 3D.
 */

/** Maximum tilt in degrees. Past this the flatness becomes obvious. */
const MAX_TILT = 9;
/** How far the figure shifts against the tilt, in px — this is what sells the depth. */
const MAX_SHIFT = 14;
const EASE = 0.09;

export function Avatar({ className }: { className?: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef(0);
  const running = useRef(false);

  const tick = useCallback(() => {
    const el = inner.current;
    if (!el) return;

    current.current.x += (target.current.x - current.current.x) * EASE;
    current.current.y += (target.current.y - current.current.y) * EASE;

    const { x, y } = current.current;
    el.style.transform =
      `rotateY(${x * MAX_TILT}deg) rotateX(${-y * MAX_TILT}deg) ` +
      `translate3d(${x * MAX_SHIFT}px, ${y * MAX_SHIFT * 0.6}px, 0)`;

    // Stop once settled. An idle page should cost nothing.
    if (
      Math.abs(target.current.x - x) > 0.0015 ||
      Math.abs(target.current.y - y) > 0.0015
    ) {
      raf.current = requestAnimationFrame(tick);
    } else {
      running.current = false;
    }
  }, []);

  const start = useCallback(() => {
    if (running.current) return;
    running.current = true;
    raf.current = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    const mq = (q: string) =>
      typeof window.matchMedia === 'function' && window.matchMedia(q).matches;

    // No tilt for reduced motion, and none on touch — there is no cursor to follow, so
    // the figure would simply sit at its rest angle forever.
    if (mq('(prefers-reduced-motion: reduce)') || !mq('(pointer: fine)')) return;

    const onMove = (e: PointerEvent) => {
      // Measured against the viewport rather than the element: the figure should lean
      // toward the cursor wherever it is on the page, not only while it is overhead.
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1;
      start();
    };
    const onLeave = () => {
      target.current.x = 0;
      target.current.y = 0;
      start();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(raf.current);
      running.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
    };
  }, [start]);

  return (
    <div
      ref={wrap}
      className={className}
      data-testid="avatar"
      style={{ perspective: '900px' }}
    >
      <div
        ref={inner}
        className="flex h-full w-full items-center justify-center will-change-transform"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/avatar/doyun.webp"
          alt="Doyun's Roblox avatar"
          width={463}
          height={620}
          // Above the fold and the largest thing in the hero, so it is fetched eagerly
          // and at high priority rather than competing with below-the-fold posters.
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="h-full w-auto max-w-full object-contain
                     drop-shadow-[0_28px_44px_rgba(0,0,0,0.55)]"
        />
      </div>
    </div>
  );
}
