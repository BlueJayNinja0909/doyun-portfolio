'use client';

import { useId } from 'react';
import type { Texture } from '@/lib/schema';
import { spriteBackgroundSize, spriteStepsX, spriteStepsY } from '@/lib/sprite';

export function Flipbook({ texture, src }: { texture: Texture; src: string }) {
  const id = useId().replace(/:/g, '');
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
        aria-label={`${title} — animated sprite sheet, ${cells} frames`}
        data-testid="flipbook-frame"
        className={`aspect-square w-full rounded-lg bg-white/5 bg-no-repeat outline-none
                    ring-offset-2 ring-offset-[#050507] focus-visible:ring-2 focus-visible:ring-white/60
                    anim-${id}`}
        style={{ backgroundImage: `url(${src})`, backgroundSize: spriteBackgroundSize(grid) }}
      />
      <style>{`
        .anim-${id} {
          background-position: 0% 0%;
        }
        @media (prefers-reduced-motion: no-preference) {
          .anim-${id}:hover,
          .anim-${id}:focus-visible {
            animation:
              sprite-x-${id} ${rowDuration}s steps(${spriteStepsX(grid)}) infinite,
              sprite-y-${id} ${totalDuration}s steps(${spriteStepsY(grid)}) infinite;
          }
        }
        @keyframes sprite-x-${id} { to { background-position-x: 100%; } }
        @keyframes sprite-y-${id} { to { background-position-y: 100%; } }
      `}</style>
      <figcaption className="mt-2 text-xs text-white/45">{title}</figcaption>
    </figure>
  );
}
