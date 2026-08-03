import { loadTextures } from '@/lib/content';
import { Flipbook } from '@/components/Flipbook';
import { Reveal } from '@doyun/motion';

export default function Page() {
  const textures = loadTextures();
  return (
    <main className="mx-auto min-h-dvh max-w-6xl px-6 pb-24">
      <header className="pt-24 pb-10">
        <h1 className="text-5xl font-extrabold tracking-[-0.04em]">Texture and flipbook studies</h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/50">
          Hand-built sprite sheets. These are separate practice work, not the
          textures used in the effects above. Hover or focus any sheet to play it.
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
