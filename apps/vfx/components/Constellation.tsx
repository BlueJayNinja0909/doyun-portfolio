'use client';

import { useEffect, useRef } from 'react';

/**
 * A scroll- and cursor-reactive constellation field behind the page content.
 *
 * Performance notes, because a continuous canvas is the one thing on this site that
 * costs real CPU:
 *  - Node count scales with viewport area and is hard-capped, so a phone does far
 *    less work than a desktop.
 *  - Neighbour search is O(n^2), which is fine at these counts and avoids the memory
 *    and complexity of a spatial index.
 *  - The loop stops entirely when the tab is hidden or the element scrolls out of
 *    view. A background tab should cost nothing.
 *  - Device pixel ratio is capped at 2; beyond that the extra pixels are invisible
 *    and the fill cost is real.
 *  - Under `prefers-reduced-motion: reduce` the field renders once, statically, and
 *    no animation loop ever starts.
 */

type Node = { x: number; y: number; vx: number; vy: number; depth: number };

const AREA_PER_NODE = 13_000;
const MAX_NODES = 140;
const MIN_NODES = 34;
const LINK_DISTANCE = 170;
const CURSOR_RADIUS = 190;
const MAX_DPR = 2;

export function Constellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    let raf = 0;
    let running = false;

    // Target values are written by listeners; rendered values ease toward them, so
    // scroll and cursor input feel damped rather than jittery.
    const cursor = { x: -9999, y: -9999, tx: -9999, ty: -9999, active: false };
    let scrollTarget = 0;
    let scrollEased = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(
        MIN_NODES,
        Math.min(MAX_NODES, Math.round((width * height) / AREA_PER_NODE)),
      );
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.12,
        // Depth drives both parallax strength and apparent size, so the field
        // reads as having space in it rather than being a flat sheet of dots.
        depth: 0.35 + Math.random() * 0.65,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      scrollEased += (scrollTarget - scrollEased) * 0.06;
      cursor.x += (cursor.tx - cursor.x) * 0.12;
      cursor.y += (cursor.ty - cursor.y) * 0.12;

      const positions = nodes.map((n) => {
        if (!reduced) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < -40) n.x = width + 40;
          if (n.x > width + 40) n.x = -40;
          if (n.y < -40) n.y = height + 40;
          if (n.y > height + 40) n.y = -40;
        }
        // Deeper nodes shift less, which is what sells the parallax.
        const py = n.y - scrollEased * n.depth * 0.22;
        return { x: n.x, y: py, depth: n.depth };
      });

      // Links first, so nodes sit on top of them.
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const a = positions[i];
          const b = positions[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist > LINK_DISTANCE) continue;

          const strength = 1 - dist / LINK_DISTANCE;
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const nearCursor = cursor.active
            ? Math.max(0, 1 - Math.hypot(midX - cursor.x, midY - cursor.y) / CURSOR_RADIUS)
            : 0;

          ctx.strokeStyle = nearCursor > 0
            ? `rgba(${Math.round(150 + nearCursor * 90)}, ${Math.round(190 + nearCursor * 50)}, 255, ${
                strength * (0.1 + nearCursor * 0.42)
              })`
            : `rgba(155, 180, 255, ${strength * 0.22})`;
          ctx.lineWidth = 0.6 + nearCursor * 0.7;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      for (const p of positions) {
        const nearCursor = cursor.active
          ? Math.max(0, 1 - Math.hypot(p.x - cursor.x, p.y - cursor.y) / CURSOR_RADIUS)
          : 0;
        const r = (1.2 + p.depth * 1.5) * (1 + nearCursor * 0.7);
        ctx.fillStyle = `rgba(${Math.round(180 + nearCursor * 60)}, ${Math.round(200 + nearCursor * 40)}, 255, ${
          0.30 + p.depth * 0.34 + nearCursor * 0.36
        })`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = () => {
      draw();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running || reduced) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onScroll = () => {
      scrollTarget = window.scrollY;
      if (reduced) draw();
    };
    const onPointer = (e: PointerEvent) => {
      cursor.tx = e.clientX;
      cursor.ty = e.clientY;
      cursor.active = true;
    };
    const onPointerLeave = () => {
      cursor.active = false;
      cursor.tx = -9999;
      cursor.ty = -9999;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const onResize = () => {
      resize();
      draw();
    };

    resize();
    draw();

    // Only animate while actually on screen.
    const io = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting && !document.hidden ? start() : stop()),
      { threshold: 0 },
    );
    io.observe(canvas);

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      io.disconnect();
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      data-testid="constellation"
      aria-hidden="true"
      // z-index -1 puts this above .ambient (-2) and below page content. It must not
      // go further back than .ambient, or the gradient layer paints over it.
      className="pointer-events-none fixed inset-0 -z-[1] h-full w-full"
    />
  );
}
