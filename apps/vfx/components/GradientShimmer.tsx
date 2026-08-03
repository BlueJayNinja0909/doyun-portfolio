'use client';

import { createElement, useEffect, useMemo, useRef, type CSSProperties, type ElementType } from 'react';

/**
 * A multi-stop gradient highlight that sweeps across text.
 *
 * Zero dependencies — the sweep is driven by the Web Animations API, and the gradient
 * is clipped to the glyphs with `background-clip: text`.
 *
 * Two details that matter more than they look:
 *
 *  - The text is revealed with `-webkit-text-fill-color: transparent` rather than
 *    `color: transparent`, so `currentColor` inside `--gs-base` still resolves to the
 *    real text colour. Using `color` would make the base colour resolve to transparent
 *    and the un-swept parts of the text would vanish.
 *  - If `background-clip: text` is unsupported, the transparent fill would hide the
 *    text completely. That case strips both properties so the text renders normally.
 *    Failing open matters here: this is the site's wordmark.
 */

export type GradientStop = { position: number; color: string };

/** Violet through pink through cyan — the site's accent range, not a full rainbow. */
const DEFAULT_STOPS: GradientStop[] = [
  { color: '#8B7BFF', position: 0 },
  { color: '#C77BFF', position: 0.28 },
  { color: '#FF7BC3', position: 0.52 },
  { color: '#FF9E7B', position: 0.72 },
  { color: '#7BE0FF', position: 1 },
];

const BAND_CORE_RATIO = 0.44;
const SPREAD_MID_RATIO = 0.72;
const BASE_FONT_PX = 14;
const MAX_SPREAD_PX = 64;
const FALLBACK_TEXT_WIDTH_PX = 96;

/**
 * Builds the CSS `background-image` for the moving band. Pure and DOM-free, so it is
 * safe on the server and can be unit-tested.
 */
export function buildBandGradient(stops: GradientStop[], angle: number): string {
  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const first = sorted[0]?.color ?? 'white';
  const last = sorted[sorted.length - 1]?.color ?? 'white';

  const core = sorted
    .map((stop) => {
      const factor = (stop.position - 0.5) * 2 * BAND_CORE_RATIO;
      return `${stop.color} calc(50% + var(--gs-spread-mid) * ${factor.toFixed(4)})`;
    })
    .join(', ');

  return [
    `linear-gradient(${angle}deg`,
    `var(--gs-base) calc(50% - var(--gs-spread))`,
    `color-mix(in oklab, var(--gs-base) 42%, ${first}) calc(50% - var(--gs-spread-mid))`,
    core,
    `color-mix(in oklab, var(--gs-base) 42%, ${last}) calc(50% + var(--gs-spread-mid))`,
    `var(--gs-base) calc(50% + var(--gs-spread)))`,
  ].join(', ');
}

function supportsBackgroundClipText(): boolean {
  if (typeof window === 'undefined') return true;
  if (typeof window.CSS?.supports !== 'function') return false;
  return (
    window.CSS.supports('background-clip', 'text') ||
    window.CSS.supports('-webkit-background-clip', 'text')
  );
}

export function GradientShimmer({
  children,
  stops = DEFAULT_STOPS,
  duration = 2.4,
  spread = 3,
  angle = 105,
  pauseBetween = 2200,
  baseColor = 'currentColor',
  as = 'span',
  className,
  style,
}: {
  /** Plain string only — the gradient sweeps across the glyphs. */
  children: string;
  stops?: GradientStop[];
  /** Sweep time in seconds. Independent of text width. */
  duration?: number;
  /** Band width in px per character, scaled by font size. */
  spread?: number;
  angle?: number;
  /** Idle gap in ms between sweeps. */
  pauseBetween?: number;
  baseColor?: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const backgroundImage = useMemo(() => buildBandGradient(stops, angle), [stops, angle]);
  const seedSpread = Math.min(children.length * spread, MAX_SPREAD_PX);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Fail open: without background-clip support the transparent fill would erase the
    // wordmark entirely, so drop both properties and let it render as normal text.
    if (!supportsBackgroundClipText()) {
      el.style.removeProperty('background-image');
      el.style.removeProperty('-webkit-text-fill-color');
      return;
    }

    const measure = () => {
      const textWidth = el.getBoundingClientRect().width || FALLBACK_TEXT_WIDTH_PX;
      const fontSize = Number.parseFloat(getComputedStyle(el).fontSize) || BASE_FONT_PX;
      const fontScale = fontSize / BASE_FONT_PX;
      const spreadPx = Math.min(children.length * spread * fontScale, MAX_SPREAD_PX * fontScale);
      const layerWidth = Math.max(1, textWidth + spreadPx * 2);
      el.style.setProperty('--gs-spread', `${spreadPx}px`);
      el.style.setProperty('--gs-spread-mid', `${spreadPx * SPREAD_MID_RATIO}px`);
      el.style.backgroundSize = `${layerWidth}px 100%`;
      return {
        start: -spreadPx - layerWidth / 2,
        end: textWidth + spreadPx - layerWidth / 2,
      };
    };

    measure();

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Under reduced motion the gradient still renders — it just doesn't travel. A
    // static multi-stop wordmark is a design, not an animation.
    if (reduced || typeof el.animate !== 'function') return;

    let anim: Animation | null = null;
    let pauseTimer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    let active = true;

    const sweep = () => {
      if (cancelled) return;
      const { start, end } = measure();
      const next = el.animate(
        [{ backgroundPosition: `${start}px center` }, { backgroundPosition: `${end}px center` }],
        { duration: duration * 1000, easing: 'cubic-bezier(0.45, 0, 0.55, 1)', fill: 'forwards' },
      );
      if (!active) next.pause();
      // Cancel the previous sweep only once the next has taken over the property.
      // Cancelling first would flash the un-swept base colour between cycles, and
      // leaving finished `fill: forwards` animations alive piles them up on the node.
      anim?.cancel();
      anim = next;
      next.onfinish = () => {
        pauseTimer = setTimeout(sweep, Math.max(0, pauseBetween));
      };
    };

    // Nothing should animate off-screen or in a hidden tab.
    const io = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting && !document.hidden;
        if (anim) (active ? anim.play() : anim.pause());
      },
      { rootMargin: '120px' },
    );
    io.observe(el);

    const onVisibility = () => {
      active = !document.hidden;
      if (anim) (active ? anim.play() : anim.pause());
    };
    document.addEventListener('visibilitychange', onVisibility);

    sweep();

    return () => {
      cancelled = true;
      anim?.cancel();
      clearTimeout(pauseTimer);
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [children, spread, duration, pauseBetween]);

  const mergedStyle: CSSProperties = {
    display: 'inline-block',
    backgroundImage,
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 100%',
    backgroundColor: 'var(--gs-base)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    ['--gs-base' as string]: baseColor,
    ['--gs-spread' as string]: `${seedSpread}px`,
    ['--gs-spread-mid' as string]: `${seedSpread * SPREAD_MID_RATIO}px`,
    ...style,
  };

  return createElement(as, { ref, className, style: mergedStyle }, children);
}
