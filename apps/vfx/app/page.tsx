import { loadEffects } from '@/lib/content';
import { ReelGrid } from '@/components/ReelGrid';

export default function Page() {
  const effects = loadEffects();
  const featured = effects.filter((e) => e.tier === 'featured');
  const practice = effects.filter((e) => e.tier === 'practice');

  return (
    <main className="mx-auto min-h-dvh max-w-6xl px-6 pb-24">
      <header className="pt-24 pb-12">
        {/* LCP element — deliberately not animated */}
        {/* Fluid rather than stepped, because "Doyun Lee" is held together by a
            non-breaking space and so has a hard minimum width. At a fixed 60px it
            measures 342px and overflowed a 320px viewport by 22px. clamp() scales it
            with the viewport instead of jumping at a breakpoint, so it fits every
            width down to 320 while still reaching 96px on desktop. */}
        <h1 className="text-[clamp(2.25rem,11vw,6rem)] font-extrabold tracking-[-0.045em]">
          {/* /50 is the lowest opacity that clears WCAG AA on this ground (5.2:1),
              so the suffix still recedes from the name without failing contrast. */}
          Doyun&nbsp;Lee <span className="text-white/50">VFX</span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">
          Roblox visual effects — particles, trails, and impact work.
          Commissions open.
        </p>
      </header>

      <section aria-labelledby="selected-heading">
        <h2
          id="selected-heading"
          className="mb-5 text-xs uppercase tracking-[0.18em] text-white/60"
        >
          Selected work
        </h2>
        {/* Only the featured grid gets `priority`, since its first tile is the
            page's LCP element. Giving both sections a priority tile would put two
            eager image fetches in competition on mobile. */}
        <ReelGrid effects={featured} priorityFirst />
      </section>

      {practice.length > 0 && (
        <section aria-labelledby="practice-heading" className="mt-20">
          <h2
            id="practice-heading"
            className="mb-2 text-xs uppercase tracking-[0.18em] text-white/60"
          >
            Practice and studies
          </h2>
          {/* Saying this plainly costs nothing and is worth more than padding the
              section above. A hiring dev judges you on your weakest visible clip,
              so the honest framing protects the featured row. */}
          <p className="mb-5 max-w-md text-xs leading-relaxed text-white/50">
            Earlier passes and experiments. Kept up because the working-out is
            worth showing, not because it is the strongest work here.
          </p>
          <ReelGrid effects={practice} />
        </section>
      )}
    </main>
  );
}
