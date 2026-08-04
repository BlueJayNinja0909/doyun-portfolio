'use client';

/**
 * A quiet indicator that there is more below.
 *
 * The intro fills the viewport, so without something here the page gives no sign that
 * scrolling does anything. The line travels down its own track on a loop, which reads
 * as an invitation rather than a decoration, and it stops entirely under
 * prefers-reduced-motion where the static track still communicates the same thing.
 */
export function ScrollCue({ label = 'Scroll' }: { label?: string }) {
  return (
    <span className="flex flex-col items-center gap-3" data-testid="scroll-cue">
      <span className="text-[10px] uppercase tracking-[0.28em] text-white/45">{label}</span>
      <span className="relative block h-10 w-px overflow-hidden bg-white/15">
        <span className="scroll-cue-tick absolute inset-x-0 top-0 block h-4 bg-white/70" />
      </span>
    </span>
  );
}
