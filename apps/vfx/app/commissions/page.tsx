export default function Page() {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-6 pb-24">
      <header className="pt-24 pb-8">
        <h1 className="text-5xl font-extrabold tracking-[-0.04em]">Commissions</h1>
        <p className="mt-4 text-sm leading-relaxed text-white/55">
          Available for combat skill effects, impacts, trails, and environmental VFX
          in Roblox. Custom textures where the effect calls for them.
        </p>
      </header>
      <section className="rounded-xl border border-white/10 p-6">
        <h2 className="text-xs uppercase tracking-[0.16em] text-white/40">Get in touch</h2>
        <a href="mailto:yippyfx@gmail.com" className="mt-3 block text-2xl font-semibold hover:underline">
          yippyfx@gmail.com
        </a>
        <p className="mt-4 text-xs leading-relaxed text-white/40">
          Include your game, the effect you have in mind, and your timeline.
        </p>
      </section>
    </main>
  );
}
