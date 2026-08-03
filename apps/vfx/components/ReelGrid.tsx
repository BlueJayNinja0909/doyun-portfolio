'use client';

import { useState } from 'react';
import type { Effect } from '@/lib/schema';
import { EffectTile } from './EffectTile';
import { Lightbox } from './Lightbox';

export function ReelGrid({ effects }: { effects: Effect[] }) {
  const [open, setOpen] = useState<Effect | null>(null);
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {effects.map((e) => (
          <EffectTile key={e.slug} effect={e} onOpen={setOpen} />
        ))}
      </div>
      <Lightbox effect={open} onClose={() => setOpen(null)} />
    </>
  );
}
