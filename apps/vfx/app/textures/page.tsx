import { loadTextures } from '@/lib/content';
import { Flipbook } from '@/components/Flipbook';
import { PulsingBorder } from '@/components/PulsingBorder';
import { Reveal } from '@doyun/motion';

export default function Page() {
  const textures = loadTextures();
  return (
    <main className="mx-auto min-h-dvh max-w-6xl px-6 pb-24">
      {/* The shader frames the heading rather than sitting behind the whole page.
          The grid below is the reason anyone is here, and these sheets are already
          saturated, animated and busy; a second animated field behind them would
          make them harder to read for no gain. Same reason the tile spotlight drops
          its wash while a clip is playing.

          `isolate` creates a stacking context so the canvas's -z-10 stays inside
          this header instead of falling behind the page's ambient layer. */}
      {/* Landscape on purpose. The shader draws a fixed 1.74:1 rectangle, so the
          container has to stay wide for it to frame anything; a short wide strip
          leaves the box floating in the middle and a near-square one clips its
          sides. 7:3 is the closest ratio that still leaves room for the heading.
          min-h wins on a narrow phone, which clips the vertical edges and leaves
          two glowing horizontal runs. That still reads as deliberate. */}
      <header className="relative isolate mt-12 mb-10 flex min-h-[18rem] flex-col justify-center overflow-hidden rounded-3xl border border-white/10 px-8 sm:aspect-[7/3] sm:px-12">
        <PulsingBorder className="absolute inset-0 -z-10" />
        <h1 className="text-[clamp(1.9rem,5vw,3rem)] font-extrabold tracking-[-0.04em]">
          Texture and flipbook studies
        </h1>
        {/* /70 rather than /50: this now sits over the shader's ground rather than
            the page's, and the pulse passes behind it. */}
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70">
          Hand-built sprite sheets. These are separate practice work, not the
          textures used in the reel. Hover or focus any sheet to play it.
        </p>
      </header>
      <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {textures.map((t, i) => (
          <Reveal key={t.slug} delay={i * 0.04}>
            <Flipbook texture={t} src={`/textures/${t.slug}.webp`} />
          </Reveal>
        ))}
      </div>
    </main>
  );
}
