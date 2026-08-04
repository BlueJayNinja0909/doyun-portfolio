import { loadEffects } from '@/lib/content';
import { ReelGrid } from '@/components/ReelGrid';
import { GradientShimmer } from '@/components/GradientShimmer';
import { ContainerScroll } from '@/components/ContainerScroll';
import { ScrollToWork } from '@/components/ScrollToWork';

export default function Page() {
  const effects = loadEffects();
  const featured = effects.filter((e) => e.tier === 'featured');
  const practice = effects.filter((e) => e.tier === 'practice');

  return (
    <main>
      {/* ---------------------------------------------------------------- intro */}
      {/* Single column, left-aligned, capped at a readable measure. Letting the text run
          the full 6xl width would give a line length that is tiring to read; the
          constellation field carries the empty right-hand space instead. */}
      <section className="mx-auto flex min-h-[80vh] max-w-6xl flex-col justify-center px-6 pb-16 pt-20">
        <div className="w-full max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
            Roblox visual effects
          </p>

          {/* LCP element. The shimmer is a background sweep on text that is already
              painted — it never delays or hides the wordmark, and under reduced motion
              it renders as a static gradient rather than not at all. */}
          <h1 className="mt-5 text-[clamp(2.25rem,7.5vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.045em]">
            <GradientShimmer duration={2.6} pauseBetween={2600} spread={2.4}>
              Doyun Lee VFX
            </GradientShimmer>
          </h1>

          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/70">
            I build particles, trails and impact effects in Roblox Studio — and the
            texture sheets underneath them. Sixteen effects and nineteen hand-built
            flipbooks below.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ScrollToWork
              targetId="work"
              className="rounded-lg border border-white/15 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold
                         transition-colors hover:border-white/30 hover:bg-white/[0.10]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              See the work
            </ScrollToWork>
            <a
              href="/commissions/"
              className="px-2 py-2.5 text-sm text-white/70 underline-offset-4 hover:text-white hover:underline
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Commissions open
            </a>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------------- work */}
      {/* overflow-x-clip because the scroll panel is rotated in 3D: a 22-degree
          rotateX projects its corners wider than its own box, which pushed a 320px
          viewport 52px sideways. `clip` rather than `hidden` so this never becomes a
          scroll container and never traps sticky positioning inside it. */}
      <section id="work" className="scroll-mt-8 overflow-x-clip pb-24">
        <ContainerScroll
          title={
            <>
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                Selected work
              </p>
              <h2 className="mt-3 text-[clamp(1.75rem,5vw,3rem)] font-extrabold tracking-[-0.04em]">
                The reel
              </h2>
            </>
          }
        >
          {/* No priorityFirst: the reel sits below the fold behind the intro, so its
              first poster is not the LCP element and eagerly fetching it at high
              priority would only compete with above-the-fold work. */}
          <ReelGrid effects={featured} />
        </ContainerScroll>

        {practice.length > 0 && (
          <div className="mx-auto mt-20 max-w-6xl px-6">
            <h2 className="mb-2 text-xs uppercase tracking-[0.18em] text-white/60">
              Practice and studies
            </h2>
            {/* Saying this plainly costs nothing and is worth more than padding the
                section above. A hiring dev judges you on your weakest visible clip,
                so the honest framing protects the featured row. */}
            <p className="mb-5 max-w-md text-xs leading-relaxed text-white/60">
              Earlier passes and experiments. Kept up because the working-out is worth
              showing, not because it is the strongest work here.
            </p>
            <ReelGrid effects={practice} />
          </div>
        )}
      </section>
    </main>
  );
}
