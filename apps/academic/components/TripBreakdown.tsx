'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { TripBreakdown as Trip } from '@/lib/transit';

/**
 * The study's lead visual: route 1's 46-minute transit trip, drawn to scale.
 *
 * The whole point is proportion — 42 minutes of walking wrapped around a 4-minute bus
 * ride. Segments are sized from the real numbers, so the bus segment is genuinely
 * ~9% of the bar rather than being drawn small for effect. Under reduced motion the
 * bar renders at full width immediately; the proportions carry the argument, the
 * animation only paces it.
 */
export function TripBreakdown({ trip, driveMinutes }: { trip: Trip; driveMinutes: string }) {
  const reduced = useReducedMotion();
  const pct = (n: number) => (n / trip.total) * 100;

  // Text colour is per-segment, not shared. White on the light walk bars measured 2.48
  // against the 4.5 AA minimum; dark ink on them reads at ~8 while keeping the walk
  // segments visually passive and the bus segment the one that stands out.
  const segments = [
    { minutes: trip.walkTo, className: 'bg-stone-400', text: 'text-stone-900' },
    { minutes: trip.bus, className: 'bg-emerald-800', text: 'text-white' },
    { minutes: trip.walkFrom, className: 'bg-stone-400', text: 'text-stone-900' },
  ];

  return (
    <figure className="my-12">
      <div
        className="flex h-14 w-full overflow-hidden rounded-md"
        role="img"
        aria-label={
          `Route 1 by transit takes ${trip.total} minutes: ${trip.walkTo} minutes walking, ` +
          `${trip.bus} minutes on the bus, then ${trip.walkFrom} minutes walking.`
        }
      >
        {segments.map((s, i) => (
          <motion.div
            key={i}
            className={`${s.className} relative flex items-center justify-center`}
            // transformOrigin left so each segment grows from its own left edge and the
            // bar builds left to right, the way the trip is actually taken.
            style={{ width: `${pct(s.minutes)}%`, transformOrigin: 'left' }}
            initial={reduced ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.5, delay: 0.12 * i, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className={`px-1 text-[11px] font-semibold tabular-nums ${s.text}`}>
              {s.minutes}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="mt-2 flex justify-between text-[11px] uppercase tracking-[0.12em] text-stone-500">
        <span>Walk {trip.walkTo} min</span>
        <span className="text-emerald-900">Bus {trip.bus} min</span>
        <span>Walk {trip.walkFrom} min</span>
      </div>

      <figcaption className="mt-5 border-l-2 border-stone-300 pl-4 text-sm leading-relaxed text-stone-600">
        The same trip by car takes <strong className="text-stone-900">{driveMinutes}</strong>. Of
        the {trip.total} minutes by transit,{' '}
        <strong className="text-stone-900">{trip.walkTo + trip.walkFrom} are spent walking</strong>{' '}
        and {trip.bus} on the bus. Route 945 runs — it is simply too far from either end of the
        trip to be worth reaching.
      </figcaption>
    </figure>
  );
}
