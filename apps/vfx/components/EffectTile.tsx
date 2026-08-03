'use client';

import type { Effect } from '@/lib/schema';

export function EffectTile({ effect, onOpen }: { effect: Effect; onOpen: (e: Effect) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(effect)}
      className="group relative block w-full overflow-hidden rounded-xl border border-white/10
                 outline-none ring-offset-2 ring-offset-[#050507] focus-visible:ring-2 focus-visible:ring-white/70"
    >
      {/* Grid tiles share one aspect ratio so the grid reads evenly, even
          though clips don't all share the same intrinsic dimensions (e.g.
          ink-swing is 1280x584, the rest are 1280x638). object-cover crops
          the poster to fit; width/height still come from the schema so the
          browser reserves the right intrinsic box for this image request. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/videos/${effect.poster}`}
        alt={effect.title}
        width={effect.width}
        height={effect.height}
        loading="lazy"
        decoding="async"
        className="aspect-[1280/638] w-full object-cover transition-transform duration-500
                   will-change-transform group-hover:scale-[1.03] motion-reduce:transition-none
                   motion-reduce:group-hover:scale-100"
      />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 text-left">
        <span className="block text-sm font-semibold">{effect.title}</span>
      </span>
    </button>
  );
}
