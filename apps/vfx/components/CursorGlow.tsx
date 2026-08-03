'use client';

import { useEffect, useRef } from 'react';

/**
 * A small soft glow that trails the cursor.
 *
 * Deliberately cheap: position is written straight to a `transform` inside a single
 * rAF loop, so it never triggers layout or paint on anything else, and the element
 * itself is a static radial gradient rather than anything redrawn per frame.
 *
 * It does not render at all on coarse pointers — a touch device has no cursor to
 * follow, and a glow stuck wherever the last tap landed looks broken.
 */

const SIZE = 320;
/** How quickly the glow catches up to the pointer. 1 would be rigid; this trails slightly. */
const EASE = 0.16;

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const finePointer = window.matchMedia('(pointer: fine)');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!finePointer.matches) return;

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let x = targetX;
    let y = targetY;
    let raf = 0;
    let visible = false;

    const place = () => {
      el.style.transform = `translate3d(${x - SIZE / 2}px, ${y - SIZE / 2}px, 0)`;
    };

    // The loop only runs while the glow is actually catching up. Idling a second rAF
    // loop alongside the constellation's costs real frame budget for nothing — it was
    // measurably worth several Lighthouse points on mobile.
    const SETTLED_PX = 0.4;
    let running = false;

    const tick = () => {
      x += (targetX - x) * EASE;
      y += (targetY - y) * EASE;
      place();
      if (Math.abs(targetX - x) < SETTLED_PX && Math.abs(targetY - y) < SETTLED_PX) {
        x = targetX;
        y = targetY;
        place();
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      start();
      if (!visible) {
        visible = true;
        el.style.opacity = '1';
        // Jump to the pointer on first sight rather than sliding in from the centre.
        x = targetX;
        y = targetY;
        place();
      }
      // Reduced motion still gets the glow, just without the trailing interpolation.
      if (reduced.matches) {
        x = targetX;
        y = targetY;
        place();
      }
    };

    const onLeave = () => {
      visible = false;
      el.style.opacity = '0';
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const start = () => {
      if (reduced.matches || running || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    place();
    start();

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div
      ref={ref}
      data-testid="cursor-glow"
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 -z-[1] opacity-0 transition-opacity duration-500
                 [will-change:transform]"
      style={{
        width: SIZE,
        height: SIZE,
        background:
          'radial-gradient(circle, rgba(150,185,255,0.16) 0%, rgba(140,110,255,0.09) 38%, transparent 68%)',
      }}
    />
  );
}
