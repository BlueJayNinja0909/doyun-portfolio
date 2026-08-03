'use client';

import { useId } from 'react';
import type { Texture } from '@/lib/schema';
import { spriteBackgroundSize, spriteStepsX, spriteStepsY, spriteFrameCount } from '@/lib/sprite';

export function Flipbook({ texture, src }: { texture: Texture; src: string }) {
  const id = useId().replace(/:/g, '');
  const { grid, fps, title } = texture;
  const frames = spriteFrameCount(grid);
  const rowDuration = grid.cols / fps;
  const totalDuration = frames / fps;

  return (
    <figure className="group relative">
      <div
        role="img"
        tabIndex={0}
        aria-label={`${title} — animated sprite sheet, ${frames} frames`}
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
