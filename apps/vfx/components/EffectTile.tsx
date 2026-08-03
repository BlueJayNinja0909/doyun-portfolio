'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import type { Effect } from '@/lib/schema';

/**
 * Milliseconds of sustained hover before the preview loads. Without this, sweeping
 * the cursor across the grid would fire five video requests the visitor never sees.
 */
const HOVER_INTENT_MS = 150;

export function EffectTile({
  effect,
  onOpen,
  onIntent,
  priority = false,
}: {
  effect: Effect;
  onOpen: (e: Effect) => void;
  /** Fired on mouseenter/focus/touchstart — a hint that a click/tap on
   *  this tile is likely imminent, used by ReelGrid to start prefetching
   *  the lazy-loaded Lightbox chunk ahead of the actual click. Purely a
   *  perf hint: onOpen (and thus the click/Enter path) works identically
   *  whether or not this ever fires. */
  onIntent?: () => void;
  /** First tile in the grid is the mobile LCP element (Lighthouse's
   *  lcp-discovery-insight audit confirmed this) — it should be fetched
   *  eagerly and with fetchpriority=high rather than competing with
   *  below-the-fold tiles for bandwidth. Every other tile stays lazy. */
  priority?: boolean;
}) {
  const reduced = useReducedMotion();
  const [previewing, setPreviewing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancel = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };

  // Reduced motion means no auto-playing video at all — the poster is a complete,
  // informative representation of the clip, and the click path still plays it.
  const arm = () => {
    onIntent?.();
    if (reduced) return;
    cancel();
    timer.current = setTimeout(() => setPreviewing(true), HOVER_INTENT_MS);
  };

  const disarm = () => {
    cancel();
    setPreviewing(false);
  };

  useEffect(() => cancel, []);

  return (
    <button
      type="button"
      onClick={() => onOpen(effect)}
      onMouseEnter={arm}
      onMouseLeave={disarm}
      onFocus={arm}
      onBlur={disarm}
      onTouchStart={onIntent}
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
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        className="aspect-[1280/638] w-full object-cover transition-transform duration-500
                   will-change-transform group-hover:scale-[1.03] motion-reduce:transition-none
                   motion-reduce:group-hover:scale-100"
      />

      {/* The preview element only exists while hovering, so nothing video-related is
          requested on page load. It is a separate ~90-170KB 480p encode, not the
          full clip — the full-quality version stays behind the click. Sits over the
          poster at the same aspect ratio, so swapping it in causes no layout shift. */}
      {previewing && (
        <video
          src={`/videos/${effect.slug}-preview.mp4`}
          poster={`/videos/${effect.poster}`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 aspect-[1280/638] h-full w-full object-cover"
        />
      )}

      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-4 text-left">
        <span className="block text-sm font-semibold">{effect.title}</span>
      </span>
    </button>
  );
}
