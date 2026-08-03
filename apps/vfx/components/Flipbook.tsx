'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { Texture } from '@/lib/schema';
import { spriteBackgroundSize, spriteStepsX, spriteStepsY } from '@/lib/sprite';

/**
 * CSS background images have no `loading="lazy"` equivalent — the browser fetches
 * every one as soon as its element renders. With 19 sheets on the textures page that
 * is ~1.6MB up front, well over this project's 800KB initial-weight budget. So the
 * URL is only attached once the tile approaches the viewport.
 *
 * rootMargin gives the sheet a screenful of runway, so it is decoded before it is
 * scrolled to and the tile never visibly pops in.
 */
const LAZY_ROOT_MARGIN = '300px';

export function Flipbook({ texture, src }: { texture: Texture; src: string }) {
  const id = useId().replace(/:/g, '');
  const frameRef = useRef<HTMLDivElement>(null);
  // Must start false even where IntersectionObserver is unavailable. This component is
  // statically prerendered, and `typeof IntersectionObserver === 'undefined'` is true
  // during that render — seeding the state from it bakes the url() into the emitted
  // HTML, so every sheet is fetched at parse time and the laziness never takes effect.
  // The fallback for environments genuinely lacking the API happens in the effect below,
  // which only ever runs on the client.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    // Fail open: a browser without IntersectionObserver should still show the sheet.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const node = frameRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: LAZY_ROOT_MARGIN },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [visible]);
  const { grid, fps, title } = texture;
  // `frames` is content metadata (how many cells carry visible art), used only
  // for schema validation elsewhere — NOT a timing input. The Y animation must
  // stay locked to a full grid cycle (cols * rows / fps), not to `frames`,
  // otherwise it advances rows out of sync with the X animation whenever the
  // sheet has trailing blank cells (frames < cols * rows). Locking to the full
  // grid means those trailing blanks play as part of the loop — correct for
  // dissipate/fade-out content, where the empty tail is the intended fade.
  const cells = grid.cols * grid.rows;
  const rowDuration = grid.cols / fps;
  const totalDuration = cells / fps;

  return (
    <figure className="group relative">
      <div
        role="img"
        tabIndex={0}
        // `cells` (the full grid capacity), not `texture.grid.frames`, is the
        // correct count here — the animation always plays the full grid (see
        // the comment above), so `cells` is what a listener actually hears.
        aria-label={`${title} — animated sprite sheet, ${cells} frames`}
        data-testid="flipbook-frame"
        className={`aspect-square w-full rounded-lg bg-white/5 bg-no-repeat outline-none
                    ring-offset-2 ring-offset-[#050507] focus-visible:ring-2 focus-visible:ring-white/60
                    anim-${id}`}
        ref={frameRef}
        style={{
          backgroundImage: visible ? `url(${src})` : undefined,
          backgroundSize: spriteBackgroundSize(grid),
        }}
      />
      <style>{`
        .anim-${id} {
          background-position: 0% 0%;
        }
        @media (prefers-reduced-motion: no-preference) {
          .anim-${id}:hover,
          .anim-${id}:focus-visible {
            animation:
              sprite-x-${id} ${rowDuration}s steps(${spriteStepsX(grid)}, jump-none) infinite,
              sprite-y-${id} ${totalDuration}s steps(${spriteStepsY(grid)}, jump-none) infinite;
          }
        }
        @keyframes sprite-x-${id} { to { background-position-x: 100%; } }
        @keyframes sprite-y-${id} { to { background-position-y: 100%; } }
      `}</style>
      <figcaption className="mt-2 text-xs text-white/60">{title}</figcaption>
    </figure>
  );
}
