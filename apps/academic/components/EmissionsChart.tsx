'use client';

import { motion, useReducedMotion } from 'motion/react';

/**
 * Per-mile CO2 by mode — the study's counterintuitive result.
 *
 * Ordered gas, transit, electric so the electric bar lands last and visibly *below*
 * the bus. Sorting by value would put them in the same order but lose the beat; the
 * point is that the bus is the one you expect to be cleanest, and it isn't, because
 * San Diego's grid carries a high renewable share.
 */
export function EmissionsChart({
  gas,
  transit,
  ev,
}: {
  gas: number;
  transit: number;
  ev: number;
}) {
  const reduced = useReducedMotion();
  const max = Math.max(gas, transit, ev);

  const bars = [
    { label: 'Gas car', value: gas, className: 'bg-[#C9563A]' },
    { label: 'Transit bus, per passenger', value: transit, className: 'bg-[#2F5D3F]' },
    { label: 'Electric car', value: ev, className: 'bg-[#3F6D8C]' },
  ];

  return (
    <figure className="my-12">
      <div className="space-y-3">
        {bars.map((b, i) => (
          // Stacks on narrow screens: a fixed 208px label column plus an 80px value
          // column is wider than a 320px phone on its own, before the bar.
          <div key={b.label} className="sm:flex sm:items-center sm:gap-3">
            <span className="block text-sm text-stone-700 sm:w-52 sm:shrink-0 sm:text-right">
              {b.label}
            </span>
            <div className="mt-1 h-7 bg-stone-200/60 sm:mt-0 sm:flex-1">
              <motion.div
                className={`${b.className} h-full`}
                style={{ width: `${(b.value / max) * 100}%`, transformOrigin: 'left' }}
                initial={reduced ? false : { scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                // The electric bar is deliberately last and slowest to arrive — it is
                // the one that changes the reader's mind.
                transition={{
                  duration: i === 2 ? 0.75 : 0.5,
                  delay: reduced ? 0 : i * 0.28,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </div>
            <span className="mt-1 block text-xs tabular-nums text-stone-600 sm:mt-0 sm:w-20 sm:shrink-0">
              {b.value.toFixed(2)} lbs
            </span>
          </div>
        ))}
      </div>

      <figcaption className="mt-6 text-sm leading-relaxed text-stone-600">
        Pounds of CO<sub>2</sub>{' '}per mile. Two caveats belong here, and they make the finding
        stronger rather than weaker: the transit figure is a SANDAG per-passenger average, so it
        depends on how full the bus is, and the result is specific to San Diego&rsquo;s grid mix.
        In a coal-heavy region it would invert.
      </figcaption>
    </figure>
  );
}
