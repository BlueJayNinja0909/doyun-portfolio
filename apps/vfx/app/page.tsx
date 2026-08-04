import { loadEffects } from '@/lib/content';
import { ReelGrid } from '@/components/ReelGrid';
import { GradientShimmer } from '@/components/GradientShimmer';
import { ContainerScroll } from '@/components/ContainerScroll';
import { ScrollToWork } from '@/components/ScrollToWork';
import { Intro } from '@/components/Intro';
import { ScrollCue } from '@/components/ScrollCue';

export default function Page() {
  const effects = loadEffects();
  const featured = effects.filter((e) => e.tier === 'featured');
  const practice = effects.filter((e) => e.tier === 'practice');

  return (
    <main>
      {/* ---------------------------------------------------------------- intro */}
      <Intro id="about" cue={<ScrollCue />}>
        <div className="w-full max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
            Roblox VFX artist
          </p>

          {/* LCP element. The shimmer is a background sweep on text that is already
              painted, so it never delays or hides the wordmark, and under reduced
              motion it renders as a static gradient rather than not at all. */}
          <h1 className="mt-5 text-[clamp(2.25rem,7.5vw,4.5rem)] font-extrabold leading-[1.02] tracking-[-0.045em]">
            <GradientShimmer duration={2.6} pauseBetween={2600} spread={2.4}>
              Doyun Lee
            </GradientShimmer>
          </h1>

          {/* ------------------------------------------------------------------
              DOYUN: this is your intro. Replace both sentences below.

              Placeholder text, but deliberately written to be true and safe to
              ship, so that forgetting to change it costs nothing worse than a
              generic paragraph. Two or three sentences fits the layout; much
              past that and it collides with the stats row on a short viewport.
              ------------------------------------------------------------------ */}
          <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/75">
            I am a high school senior in San Diego who builds visual effects in Roblox
            Studio. Mostly particles, trails and impact work, along with the texture
            sheets underneath them.
          </p>

          {/* A short count carries more weight than an adjective, and it is all
              verifiable further down the page. */}
          <dl className="mt-7 flex flex-wrap gap-x-9 gap-y-3">
            {[
              ['16', 'effects'],
              ['19', 'texture sheets'],
              ['Open', 'for commissions'],
            ].map(([value, label]) => (
              <div key={label}>
                <dt className="text-xl font-semibold tabular-nums">{value}</dt>
                <dd className="mt-0.5 text-[11px] uppercase tracking-[0.14em] text-white/60">
                  {label}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <ScrollToWork
              targetId="work"
              className="rounded-lg border border-white/20 bg-white/[0.08] px-5 py-2.5 text-sm font-semibold
                         backdrop-blur-sm transition-colors hover:border-white/35 hover:bg-white/[0.14]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              See the work
            </ScrollToWork>
            <a
              href="/commissions/"
              className="px-2 py-2.5 text-sm text-white/75 underline-offset-4 hover:text-white hover:underline
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Commissions open
            </a>
          </div>
        </div>
      </Intro>

      {/* ----------------------------------------------------------------- work */}
      {/* overflow-x-clip because the scroll panel is rotated in 3D: a 22-degree
          rotateX projects its corners wider than its own box, which pushed a 320px
          viewport 52px sideways. `clip` rather than `hidden` so this never becomes a
          scroll container and never traps sticky positioning inside it. */}
      {/* -100vh is exact, not tuned by eye.

          A pinned section of height H leaves a trailing block equal to its sticky child's
          height once that child is released: the child stops sticking at (H - 100vh) but
          the section keeps occupying layout until H. That last 100vh is dead space the
          hero has already faded out of, and it read as a full empty screen between the
          two sections. Pulling this section up by exactly the child's height puts the
          reel's first frame precisely where the pin lets go, and the value holds for any
          H, so changing the intro's length above does not require retuning it here.

          `relative z-10` puts this above the intro's sticky child, so the reel rises
          through the dissolving hero rather than sliding behind it. */}
      <section id="work" className="relative z-10 -mt-[100vh] scroll-mt-8 overflow-x-clip pb-24">
        <ContainerScroll
          title={
            <>
              {/* This heading is the other half of the nav's two buttons: the top of the
                  page is Doyun, this is the work. The wordmark no longer carries "VFX",
                  so it has to be unambiguous here. */}
              <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">
                Selected work
              </p>
              <h2 className="mt-3 text-[clamp(1.75rem,5vw,3rem)] font-extrabold tracking-[-0.04em]">
                VFX
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
