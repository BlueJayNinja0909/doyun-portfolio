'use client';

import { useCallback, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

/**
 * Cursor-tracking spotlight for a card.
 *
 * The widely-circulated version of this effect attaches a `pointermove` listener to
 * `document` from inside every card and positions the gradient with
 * `background-attachment: fixed`. With sixteen tiles that is sixteen global listeners
 * all recomputing the same two numbers on every mouse move, plus a fixed-attachment
 * background that repaints on every scroll frame.
 *
 * This does the same thing for a fraction of the cost:
 *
 *  - Handlers live on the card, not the document. React delegates them, and they only
 *    fire while the pointer is genuinely over that card — so at most one card is doing
 *    any work at any moment, no matter how many are on screen.
 *  - Coordinates are element-local, so the gradient needs no fixed attachment.
 *  - The bounding rect is measured once on enter rather than per move; reading it on
 *    every event would force layout on each frame of a drag across the grid.
 *  - Writes go straight to a CSS custom property. No React state, so moving the mouse
 *    never triggers a render.
 */
export function useSpotlight() {
  const ref = useRef<HTMLElement | null>(null);
  const rect = useRef<DOMRect | null>(null);
  const frame = useRef(0);
  const reduced = useReducedMotion();

  const onPointerEnter = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (reduced) return;
      const el = e.currentTarget;
      ref.current = el;
      // Measured once per hover. Reading it on every pointermove would force a
      // layout on each frame.
      rect.current = el.getBoundingClientRect();
      el.style.setProperty('--spot-opacity', '1');
    },
    [reduced],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (reduced || !rect.current) return;
      const el = e.currentTarget;
      const r = rect.current;
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;

      // Coalesce to one write per frame. A high-polling-rate mouse can fire
      // pointermove well above 60Hz, and every extra write is a wasted style
      // recalculation.
      cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        el.style.setProperty('--spot-x', `${x}px`);
        el.style.setProperty('--spot-y', `${y}px`);
        // Hue follows horizontal position across the card, so the glow shifts as the
        // cursor travels rather than being a flat colour.
        el.style.setProperty('--spot-shift', (x / r.width).toFixed(3));
      });
    },
    [reduced],
  );

  const onPointerLeave = useCallback((e: React.PointerEvent<HTMLElement>) => {
    cancelAnimationFrame(frame.current);
    rect.current = null;
    e.currentTarget.style.setProperty('--spot-opacity', '0');
  }, []);

  return { onPointerEnter, onPointerMove, onPointerLeave, spotlightEnabled: !reduced };
}
