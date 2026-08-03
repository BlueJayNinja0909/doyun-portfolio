'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { SPRING_SNAPPY } from '@doyun/motion';
import type { Effect } from '@/lib/schema';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), video[controls], [tabindex]:not([tabindex="-1"])';

export function Lightbox({ effect, onClose }: { effect: Effect | null; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!effect) return;

    // Remember whatever had focus before the dialog opened (realistically
    // the EffectTile <button> that was clicked/activated) so we can return
    // the keyboard user to their place in the grid on close, rather than
    // dropping them at <body>.
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const container = dialogRef.current;
      if (!container) return;

      // Query focusable descendants fresh on every keydown, not once on
      // mount: the realistic set here is the close button and the <video
      // controls> element, and which is "first"/"last" can change (e.g. if
      // the video fails to load and drops out of the tab order).
      const focusable = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey) {
        if (active === first || !container.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !container.contains(active)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      // Return focus to the element that opened the dialog (the tile), not
      // <body> — otherwise a keyboard user loses their place in the grid
      // every time they close a clip.
      previouslyFocused.current?.focus?.();
      previouslyFocused.current = null;
    };
  }, [effect, onClose]);

  return (
    <AnimatePresence>
      {effect && (
        <motion.div
          ref={dialogRef}
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
                uniform tile ratio) reserve the correct box before load.
                tabIndex is explicit rather than relying on implicit
                controls-focusability, since that's the realistic second
                stop (after the close button) in the focus trap below. */}
            <video
              key={effect.slug}
              src={`/videos/${effect.video}`}
              poster={`/videos/${effect.poster}`}
              width={effect.width}
              height={effect.height}
              tabIndex={0}
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
