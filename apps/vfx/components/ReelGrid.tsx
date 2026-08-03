'use client';

import { lazy, Suspense, useState } from 'react';
import type { Effect } from '@/lib/schema';
import { EffectTile } from './EffectTile';

// Lightbox pulls in `motion/react` (AnimatePresence, useReducedMotion),
// which Lighthouse's mobile run flagged as ~45 KB transferred / 85% unused
// on this route — because the grid renders Lightbox up front even though
// nobody has clicked a tile yet. Deferring the import until the first
// click keeps Motion out of the initial bundle for the common case (a
// visitor who just browses the grid) without changing when the component
// mounts relative to state: once `everOpened` flips true it stays
// mounted (with `effect` cycling null/non-null) for the rest of the
// page's life, exactly like the eager version did, so Lightbox's own
// AnimatePresence still gets to run its exit animation on close instead
// of being unmounted out from under it.
//
// The lazy import is factored out to a standalone function so the
// prefetch-on-intent trigger below (hover/focus/touchstart) can call the
// exact same import() as React.lazy — same chunk, same module cache entry.
const importLightbox = () => import('./Lightbox').then((m) => ({ default: m.Lightbox }));
const Lightbox = lazy(importLightbox);

// A `Suspense fallback={null}` boundary means a click that lands before the
// chunk arrives shows nothing at all until it does — on a throttled mobile
// connection that's a ~200-400ms window where the tile looks unresponsive.
// Rather than add a spinner (its own kind of noise for what's normally an
// instant transition) or go back to eager-loading Motion for everyone,
// prefetch the chunk on *intent* signals that reliably precede a real
// click/tap by enough margin to cover the fetch: mouseenter and focus on
// desktop/keyboard, touchstart on mobile (fires ~100-300ms before the
// synthesized click). Module-level promise cache makes repeated intent
// signals (e.g. mouseenter firing on every tile hovered while scanning the
// grid) a no-op after the first, and a failed prefetch is swallowed here —
// it never throws into an event handler and never blocks the click path,
// which always still works by falling through to React.lazy's own import()
// (browsers/webpack resolve a second import() of the same specifier from
// the already-in-flight or cached fetch, so nothing is duplicated there
// either).
let lightboxPreload: Promise<unknown> | null = null;
function preloadLightbox() {
  if (!lightboxPreload) {
    lightboxPreload = importLightbox().catch(() => {
      // Allow a later intent signal (or the click itself, via React.lazy)
      // to retry rather than permanently caching a rejected promise.
      lightboxPreload = null;
    });
  }
}

export function ReelGrid({
  effects,
  priorityFirst = false,
}: {
  effects: Effect[];
  /**
   * Marks this grid's first tile as the LCP element (eager + fetchpriority=high).
   * Only one grid on a page should set it — two eager image fetches competing for
   * bandwidth on mobile is worse than one, which is why the practice section
   * below the fold leaves every tile lazy.
   */
  priorityFirst?: boolean;
}) {
  const [open, setOpen] = useState<Effect | null>(null);
  const [everOpened, setEverOpened] = useState(false);

  const handleOpen = (effect: Effect) => {
    setEverOpened(true);
    setOpen(effect);
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {effects.map((e, i) => (
          <EffectTile
            key={e.slug}
            effect={e}
            onOpen={handleOpen}
            onIntent={preloadLightbox}
            priority={priorityFirst && i === 0}
          />
        ))}
      </div>
      {everOpened && (
        <Suspense fallback={null}>
          <Lightbox effect={open} onClose={() => setOpen(null)} />
        </Suspense>
      )}
    </>
  );
}
