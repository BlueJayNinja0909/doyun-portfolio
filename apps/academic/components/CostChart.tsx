'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { CostRow } from '@/lib/transit';

/**
 * Round-trip cost per route, three modes side by side.
 *
 * The argument this chart makes is that the answer flips. On the two short trips with
 * free parking, driving is cheaper than a $5 transit fare. On the two trips that end
 * somewhere you must pay to park, the $20 parking charge swamps everything and transit
 * wins by a wide margin. Drawing all four routes on one shared scale is what makes the
 * flip visible — normalising each route to its own maximum would hide it.
 */
export function CostChart({ rows, parkingRoutes }: { rows: CostRow[]; parkingRoutes: number[] }) {
  const reduced = useReducedMotion();
  const max = Math.max(...rows.flatMap((r) => [r.gas, r.ev, r.transit]));

  const modes = [
    { key: 'gas' as const, label: 'Gas car', className: 'bg-[#C9563A]' },
    { key: 'ev' as const, label: 'Electric', className: 'bg-[#3F6D8C]' },
    { key: 'transit' as const, label: 'Transit', className: 'bg-[#2F5D3F]' },
  ];

  return (
    <figure className="my-12">
      <div className="mb-4 flex flex-wrap gap-4 text-[11px] uppercase tracking-[0.12em] text-stone-600">
        {modes.map((m) => (
          <span key={m.key} className="flex items-center gap-2">
            <span className={`${m.className} inline-block h-2.5 w-2.5 rounded-[2px]`} />
            {m.label}
          </span>
        ))}
      </div>

      <div className="space-y-6">
        {rows.map((row, ri) => (
          <div key={row.route}>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="text-sm font-medium text-stone-800">{row.label}</span>
              {parkingRoutes.includes(row.route) && (
                <span className="text-[11px] uppercase tracking-[0.1em] text-stone-500">
                  paid parking
                </span>
              )}
            </div>

            <div className="space-y-1">
              {modes.map((m, mi) => {
                const value = row[m.key];
                const cheapest = value === Math.min(row.gas, row.ev, row.transit);
                return (
                  <div key={m.key} className="flex items-center gap-3">
                    <div className="h-5 flex-1 bg-stone-200/60">
                      {/* Width encodes the value; scaleX only animates it in. Putting the
                          width on a child of the animated element would render every bar
                          the same length. */}
                      <motion.div
                        className={`${m.className} h-full`}
                        style={{ width: `${(value / max) * 100}%`, transformOrigin: 'left' }}
                        initial={reduced ? false : { scaleX: 0 }}
                        whileInView={{ scaleX: 1 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={{
                          duration: 0.55,
                          delay: reduced ? 0 : ri * 0.08 + mi * 0.06,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      />
                    </div>
                    <span
                      className={`w-16 shrink-0 text-right text-xs tabular-nums ${
                        cheapest ? 'font-semibold text-stone-900' : 'text-stone-500'
                      }`}
                    >
                      ${value.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <figcaption className="mt-6 text-sm leading-relaxed text-stone-600">
        Round trip, including parking where it is charged. Cheapest option per route in bold.
      </figcaption>
    </figure>
  );
}
