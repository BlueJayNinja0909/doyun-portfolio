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
          in Roblox. Custom textures when needed.
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

        {/* Elsewhere, kept under the email rather than beside it: email is how a
            commission actually starts, and these are for looking someone up. */}
        <div className="mt-6 border-t border-white/10 pt-5">
          <h3 className="text-xs uppercase tracking-[0.16em] text-white/60">Elsewhere</h3>
          <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {[
              // Tracking parameters stripped from the Instagram link Doyun sent. The
              // original carried `igsh`, a share token tied to the QR that produced it,
              // plus utm_source=qr. Neither is needed to reach the profile and a share
              // token is not something to publish on a page anyone can read.
              ['Instagram', 'https://www.instagram.com/ddoyunlee_'],
              ['LinkedIn', 'https://www.linkedin.com/in/doyun-lee-83b108390/'],
            ].map(([label, href]) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  // noreferrer alongside noopener: the first is the security one, the
                  // second stops the destination seeing where the click came from.
                  rel="noopener noreferrer"
                  className="text-white/75 underline-offset-4 hover:text-white hover:underline
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
