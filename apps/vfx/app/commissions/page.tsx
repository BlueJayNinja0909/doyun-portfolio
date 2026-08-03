export default function Page() {
  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-6 pb-24">
      <header className="pt-24 pb-8">
        {/* Single unbreakable word — at a fixed 48px it is wider than a 320px
            viewport, so it scales with the viewport instead. */}
        <h1 className="text-[clamp(2rem,9vw,3rem)] font-extrabold tracking-[-0.04em]">
          Commissions
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/55">
          Available for combat skill effects, impacts, trails, and environmental VFX
          in Roblox. Custom textures where the effect calls for them.
        </p>
      </header>
      <section className="rounded-xl border border-white/10 p-6">
        <h2 className="text-xs uppercase tracking-[0.16em] text-white/60">Get in touch</h2>
        {/* An email address has no spaces to break on, so at a fixed size it forces
            the page wider than a narrow phone. Scales with the viewport, and breaks
            mid-address only as a last resort rather than pushing the layout out. */}
        <a
          href="mailto:yippyfx@gmail.com"
          className="mt-3 block break-words text-[clamp(1.125rem,5.5vw,1.5rem)] font-semibold hover:underline"
        >
          yippyfx@gmail.com
        </a>
        <p className="mt-4 text-xs leading-relaxed text-white/60">
          Include your game, the effect you have in mind, and your timeline.
        </p>
      </section>
    </main>
  );
}
