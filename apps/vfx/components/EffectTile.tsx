'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import type { Effect } from '@/lib/schema';
import { useSpotlight } from './useSpotlight';

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
  const spotlight = useSpotlight();
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
      // Spotlight handlers live here rather than on `document`: they only fire while
      // the pointer is actually over this tile, so however many tiles are on screen,
      // at most one is doing any work.
      onPointerEnter={spotlight.onPointerEnter}
      onPointerMove={spotlight.onPointerMove}
      onPointerLeave={spotlight.onPointerLeave}
      // `data-previewing` drives the CSS that suppresses the interior wash while a
      // clip is playing — a coloured film over the footage is exactly what makes an
      // effect harder to read, which is the one thing these tiles exist to show.
      data-previewing={previewing ? '' : undefined}
      className="spotlight group relative block w-full rounded-xl border border-white/10 p-3
                 text-left outline-none ring-offset-2 ring-offset-[#050507]
                 focus-visible:ring-2 focus-visible:ring-white/70"
    >
      {/* Media is inset inside the card rather than bleeding to its edges. That gives
          the border light something to sit on without touching the footage, and keeps
          the burned-in "Made by Doyun Lee" credit in each clip's lower-left clear of
          the card edge. */}
      <span className="relative block overflow-hidden rounded-lg">
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
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </span>

      {/* Title sits below the media now rather than overlaying it. Nothing is drawn on
          top of the footage at all, so neither the effect nor the credit burned into
          it is ever obscured. z-10 keeps it above the spotlight layers. */}
      <span className="relative z-10 mt-3 flex items-baseline justify-between gap-3 px-1 pb-0.5">
        <span className="text-sm font-semibold">{effect.title}</span>
        <span className="text-[10px] uppercase tracking-[0.14em] text-white/50">
          {effect.tier === 'featured' ? 'Selected' : 'Study'}
        </span>
      </span>
    </button>
  );
}
