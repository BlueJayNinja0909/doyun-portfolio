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
const Lightbox = lazy(() => import('./Lightbox').then((m) => ({ default: m.Lightbox })));

export function ReelGrid({ effects }: { effects: Effect[] }) {
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
          <EffectTile key={e.slug} effect={e} onOpen={handleOpen} priority={i === 0} />
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
