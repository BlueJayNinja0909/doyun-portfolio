'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

/**
 * A scroll-driven perspective tilt: content starts rotated back and flattens as it
 * comes up the page, like a screen being raised toward the viewer.
 *
 * Adapted from the widely-circulated version, with three changes:
 *
 *  - Imports from `motion/react`, not `framer-motion`. They are the same library —
 *    Motion is the current name — and installing both would ship two copies.
 *  - The mobile branch uses a CSS media query rather than a `resize` listener and
 *    `useState`. The original re-renders the whole subtree on every resize frame, and
 *    renders the desktop scale on the server before correcting after hydration.
 *  - Under `prefers-reduced-motion` the transform is skipped entirely. A 20-degree
 *    rotation tied to scroll position is exactly the kind of motion that setting
 *    exists to suppress.
 */
export function ContainerScroll({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // `offset` matters: the default measures the whole element against the viewport,
  // which on a tall container means the animation finishes long before the content
  // is actually in view.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const rotate = useTransform(scrollYProgress, [0, 0.45], [22, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.45], [0.92, 1]);
  const lift = useTransform(scrollYProgress, [0, 0.45], [64, 0]);

  // Reduced motion is handled in CSS (`.scroll-panel`, globals.css), not by branching
  // here.
  //
  // `useReducedMotion()` resolves differently on the server than on the client, so any
  // JS branch on it renders one tree during SSR and a different one at hydration —
  // React then replaces those nodes, and anything holding a reference to a tile at that
  // moment (a focused element, an in-flight hover, a test) loses it. A media query is
  // evaluated by the browser at paint time and never disagrees with itself.
  return (
    <div ref={ref} className="mx-auto w-full max-w-6xl px-6">
      <motion.div style={{ y: lift }} className="scroll-panel mb-10 text-center">
        {title}
      </motion.div>

      {/* perspective on the parent, rotateX on the child — applying both to one element
          makes the rotation flat and kills the effect. */}
      <div className="scroll-perspective">
        <motion.div
          style={{ rotateX: rotate, scale, transformOrigin: 'center top' }}
          className="scroll-panel rounded-2xl border border-white/10 bg-white/[0.02] p-3 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] sm:p-5"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
