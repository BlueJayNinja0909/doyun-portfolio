'use client';

import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';

/**
 * The 3D avatar is loaded only when it is actually going to be used: a fine pointer,
 * no reduced-motion preference, and a viewport wide enough to show it. Everyone else
 * gets the flat render, which is the same avatar and 48KB.
 *
 * This is why the 3D path is affordable at all — three.js, the Draco decoder and the
 * 371KB mesh never reach a phone.
 */
const AvatarScene = lazy(() => import('./AvatarScene'));

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
  const [use3d, setUse3d] = useState(false);

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

    // The same gates decide the 3D upgrade, plus a viewport wide enough to show the
    // mesh — below that the figure renders too small for the detail to be visible and
    // the download would be wasted. Deferred a beat so it never competes with first
    // paint, and the flat render keeps tilting until it arrives.
    let upgrade: ReturnType<typeof setTimeout> | undefined;
    if (window.innerWidth >= 900) {
      upgrade = setTimeout(() => setUse3d(true), 400);
    }

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
      clearTimeout(upgrade);
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
      style={{ perspective: '900px', position: 'relative' }}
    >
      {/* Once the mesh is ready it replaces the flat render entirely — showing both
          would double the figure. The image stays mounted until then so there is never
          an empty hole in the hero. */}
      {use3d && (
        <Suspense fallback={null}>
          <div className="absolute inset-0" data-testid="avatar-3d">
            <AvatarScene />
          </div>
        </Suspense>
      )}

      <div
        ref={inner}
        className={`flex h-full w-full items-center justify-center will-change-transform
                    transition-opacity duration-500 ${use3d ? 'opacity-0' : 'opacity-100'}`}
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
