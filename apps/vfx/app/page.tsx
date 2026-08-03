import { loadEffects } from '@/lib/content';
import { ReelGrid } from '@/components/ReelGrid';

export default function Page() {
  const effects = loadEffects();
  return (
    <main className="mx-auto min-h-dvh max-w-6xl px-6 pb-24">
      <header className="pt-24 pb-12">
        {/* LCP element — deliberately not animated */}
        <h1 className="text-6xl font-extrabold tracking-[-0.045em] sm:text-8xl">
          {/* /50 is the lowest opacity that clears WCAG AA on this ground (5.2:1),
              so the suffix still recedes from the wordmark without failing contrast. */}
          Doyun<span className="text-white/50">.vfx</span>
        </h1>
        <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">
          Roblox visual effects — particles, trails, and impact work.
          Commissions open.
        </p>
      </header>
      <ReelGrid effects={effects} />
    </main>
  );
}
