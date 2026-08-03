'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SPRING_SNAPPY } from '@doyun/motion';
import type { Effect } from '@/lib/schema';

export function Lightbox({ effect, onClose }: { effect: Effect | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!effect) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [effect, onClose]);

  return (
    <AnimatePresence>
      {effect && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={effect.title}
          className="fixed inset-0 z-50 grid place-items-center bg-black/92 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-5xl"
            initial={reduced ? false : { scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduced ? undefined : { scale: 0.96, opacity: 0 }}
            transition={SPRING_SNAPPY}
            onClick={(e) => e.stopPropagation()}
          >
            {/* This <video> — and the whole lightbox tree — only exists in
                the DOM while `effect` is non-null, i.e. only after a tile is
                clicked. Nothing here is fetched on initial grid render;
                that's the whole performance contract this component exists
                to protect. Its own intrinsic width/height (not the grid's
                uniform tile ratio) reserve the correct box before load. */}
            <video
              key={effect.slug}
              src={`/videos/${effect.video}`}
              poster={`/videos/${effect.poster}`}
              width={effect.width}
              height={effect.height}
              controls
              autoPlay
              muted
              loop
              playsInline
              className="w-full rounded-xl"
            />
            <div className="mt-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{effect.title}</h2>
              <button
                ref={closeRef}
                onClick={onClose}
                className="rounded px-3 py-1 text-sm text-white/70 hover:text-white"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
