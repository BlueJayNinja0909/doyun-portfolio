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
export function Intro({
  children,
  cue,
  id,
}: {
  children: ReactNode;
  cue: ReactNode;
  /** Anchor target, so the nav's "Doyun Lee" pill can link back to the top section. */
  id?: string;
}) {
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

  // Progress across the pin, 0 when the section's top meets the top of the viewport and
  // 1 at the moment the sticky child is released.
  //
  // The end offset must be 'end end', not 'end start'. 'end start' does not reach 1 until
  // the section's bottom edge has travelled all the way to the top of the viewport, which
  // on a 190vh section is 820px after the sticky child already let go. The sequence was
  // therefore only ever playing to progress 0.47 before the hero scrolled away: the clip
  // crept from scale 0.88 to 0.985 instead of reaching 1.06, and the veil stopped at 0.26
  // instead of lifting to 0.10. Everything below is tuned against a runway that now
  // actually finishes on screen.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  // The clip opens as a contained panel and expands to fill. Scale rather than width
  // or inset so the whole move stays on the compositor.
  // Starts at full bleed, not inset.
  //
  // It previously opened at 88% scale inside a 24px margin with a 26px radius, so
  // the first screen was a rounded panel floating on the constellation backdrop
  // with that backdrop visible all the way around it. Two competing layers, and
  // the seam was the first thing you saw. It now fills the viewport from the start
  // and still grows, so the move is a slow push in rather than a box unfolding.
  const clipScale = useTransform(scrollYProgress, [0, 0.8], [1, 1.08]);
  // Overlay lifts as you scroll, so the effect is dimmest where the text sits over it
  // and clearest once the text has gone. Kept light: the left-hand gradient below is
  // what actually protects the text, so a heavy flat wash here only buries the effect
  // the hero exists to show.
  const veil = useTransform(scrollYProgress, [0, 0.75], [0.42, 0.1]);
  // The text-protection gradient has to lift too, and this is the one that was missed.
  // It was a plain div with no binding at all, so it stayed fully opaque for the entire
  // sequence and kept the left third of the frame black long after the wordmark it was
  // protecting had faded out. It now clears just after the text does.
  const gradient = useTransform(scrollYProgress, [0.12, 0.45], [1, 0]);
  // Wordmark rises and fades well before the section ends, handing off to the reel.
  const textY = useTransform(scrollYProgress, [0, 0.55], [0, -140]);
  const textOpacity = useTransform(scrollYProgress, [0, 0.38], [1, 0]);
  const cueOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  // The last beat: once the clip is full bleed there is nothing left for it to do, so it
  // dissolves into the page background and the reel rises through it. Without this the
  // hero simply stops existing at the pin release, which reads as a hard cut between two
  // stacked pages rather than one continuous move.
  const heroFade = useTransform(scrollYProgress, [0.86, 1], [1, 0]);

  const still = reduced ? undefined : true;
  const animate = !reduced;

  const veilRef = useOpacityFrom(veil, animate);
  const gradientRef = useOpacityFrom(gradient, animate);
  const textRef = useOpacityFrom(textOpacity, animate);
  const cueRef = useOpacityFrom(cueOpacity, animate);
  const stageRef = useOpacityFrom(heroFade, animate);

  return (
    // 220vh gives the pin a 120vh runway. At 190vh the whole sequence had to resolve in
    // 90vh, which is under a screen and a half of scrolling and felt hurried once the
    // animation actually played to completion rather than stopping halfway.
    <section ref={ref} id={id} className="relative h-[220vh]" data-testid="intro">
      <div
        ref={stageRef}
        className="sticky top-0 flex h-screen items-center overflow-hidden"
      >
        {/* Clip layer */}
        <motion.div
          className="absolute inset-0 overflow-hidden"
          style={still ? { scale: clipScale } : undefined}
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
          className="pointer-events-none absolute inset-0 bg-[#050507]"
          style={{ opacity: 0.42 }}
          aria-hidden="true"
        />
        <div
          ref={gradientRef}
          // Explicit stops rather than the default even spread.
          //
          // `via-85% to-transparent` spread the darkening across the full width, which
          // suited beam clash because that effect filled the frame edge to edge and had
          // brightness to spare on the right. The spin clip is composed around a single
          // centred vortex, so the same ramp buried the subject and left a hero that
          // looked like an empty sky. This holds full strength over the left 22% where
          // the wordmark actually sits, eases through the paragraph, and is gone by 66%
          // so the effect is visible in the half of the frame that has no text on it.
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#050507_0%,#050507_22%,rgba(5,5,7,0.72)_42%,transparent_66%)]"
          style={{ opacity: 1 }}
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
