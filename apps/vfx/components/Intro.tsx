'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValueEvent,
  type MotionValue,
} from 'motion/react';

/**
 * Binds a MotionValue to an element's opacity.
 *
 * Passing the value through `style={{ opacity }}` on a motion component did not take
 * here: transforms driven by the same scroll value updated correctly while opacity
 * stayed pinned at its initial 1, verified by reading the inline style during a scroll.
 * Writing it on each change is unambiguous, costs one property assignment per frame,
 * and is easy to check.
 */
function useOpacityFrom(value: MotionValue<number>, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);

  useMotionValueEvent(value, 'change', (v) => {
    if (enabled && ref.current) ref.current.style.opacity = String(v);
  });

  useEffect(() => {
    if (ref.current) ref.current.style.opacity = enabled ? String(value.get()) : '1';
  }, [enabled, value]);

  return ref;
}

/**
 * The intro: one of Doyun's effects playing behind the wordmark, pinned while you
 * scroll through it.
 *
 * The section is taller than the viewport and its contents are sticky, so scrolling
 * does not move the hero away. It plays it. Across that runway the clip grows from an
 * inset panel to full bleed, its overlay lifts so the effect reads more clearly, and
 * the wordmark rises out of the way. By the end the reel is arriving underneath.
 *
 * The reason the hero shows a clip at all: a visual effects portfolio whose first
 * screen contains no visual effects is asking to be judged on its typography.
 *
 * Everything here animates transform and opacity only, and the whole sequence is
 * inert under prefers-reduced-motion, where the clip is replaced by its poster frame.
 */
export function Intro({ children, cue }: { children: ReactNode; cue: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // The clip is only rendered after mount, never during prerender.
  //
  // `useReducedMotion` reports false while the page is being statically generated, so
  // rendering the video on that pass bakes a <video src> into the emitted HTML. The
  // browser then fetches and plays it before any preference is read, and a visitor who
  // asked for reduced motion gets an autoplaying loop anyway. Starting from the poster
  // and swapping in the clip on the client is what makes the preference actually
  // authoritative.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const playClip = mounted && !reduced;

  // Progress across the section's own scroll runway: 0 when its top meets the top of
  // the viewport, 1 when its bottom does.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  // The clip opens as a contained panel and expands to fill. Scale rather than width
  // or inset so the whole move stays on the compositor.
  const clipScale = useTransform(scrollYProgress, [0, 0.75], [0.88, 1.06]);
  const clipRadius = useTransform(scrollYProgress, [0, 0.55], [26, 0]);
  // Overlay lifts as you scroll, so the effect is dimmest where the text sits over it
  // and clearest once the text has gone. Kept light: the left-hand gradient below is
  // what actually protects the text, so a heavy flat wash here only buries the effect
  // the hero exists to show.
  const veil = useTransform(scrollYProgress, [0, 0.8], [0.42, 0.12]);
  // Wordmark rises and fades well before the section ends, handing off to the reel.
  const textY = useTransform(scrollYProgress, [0, 0.6], [0, -120]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.42], [1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.12], [1, 0]);

  const still = reduced ? undefined : true;
  const animate = !reduced;

  const veilRef = useOpacityFrom(veil, animate);
  const textRef = useOpacityFrom(textOpacity, animate);
  const cueRef = useOpacityFrom(cueOpacity, animate);

  return (
    <section ref={ref} className="relative h-[190vh]" data-testid="intro">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        {/* Clip layer */}
        <motion.div
          className="absolute inset-3 overflow-hidden md:inset-6"
          style={
            still
              ? { scale: clipScale, borderRadius: clipRadius }
              : { borderRadius: 26 }
          }
        >
          {!playClip ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/videos/hero-poster.jpg"
              alt=""
              aria-hidden="true"
              data-testid="hero-still"
              className="h-full w-full object-cover"
            />
          ) : (
            <video
              src="/videos/hero.mp4"
              poster="/videos/hero-poster.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              aria-hidden="true"
              tabIndex={-1}
              data-testid="hero-clip"
              className="h-full w-full object-cover"
            />
          )}
        </motion.div>

        {/* Veil. Two gradients rather than a flat wash: the text sits top left, so the
            heaviest darkening is there and the effect stays visible to the right. */}
        <div
          ref={veilRef}
          className="pointer-events-none absolute inset-3 bg-[#050507] md:inset-6"
          style={{ opacity: 0.42 }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-3 bg-gradient-to-r from-[#050507] via-[#050507]/85 to-transparent md:inset-6"
          aria-hidden="true"
        />

        {/* Content */}
        <motion.div
          className="relative mx-auto w-full max-w-6xl px-6 md:px-12"
          style={still ? { y: textY } : undefined}
        >
          <div ref={textRef}>{children}</div>
        </motion.div>

        <div ref={cueRef} className="absolute inset-x-0 bottom-8 flex justify-center">
          {cue}
        </div>
      </div>
    </section>
  );
}
