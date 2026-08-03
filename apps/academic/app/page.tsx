export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-24">
      <header className="pt-10">
        {/* LCP element — not animated. */}
        <h1 className="font-serif text-[clamp(2rem,7vw,3.25rem)] leading-[1.08] tracking-[-0.015em]">
          Doyun Lee
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-stone-700">
          I measure things I don&rsquo;t know the answer to, and build things to find out.
          Currently a senior at Rancho Bernardo High School in San Diego, headed for economics.
        </p>
      </header>

      <section className="mt-14 border-t border-stone-200 pt-10">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-stone-600">Work</h2>

        <a
          href="/work/transit-vs-driving/"
          className="group mt-6 block border-b border-stone-200 pb-8"
        >
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
            Independent research &middot; June 2025
          </p>
          <h3 className="mt-2 font-serif text-2xl leading-snug tracking-[-0.01em] group-hover:underline">
            In San Diego, the electric car is cleaner than the bus.
          </h3>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-stone-700">
            Four Rancho Bernardo routes measured door to door for cost, time and carbon, plus a
            16-person survey on why people drive anyway. The transit trip to school is 46
            minutes — 42 of them on foot.
          </p>
          <span className="mt-3 inline-block text-[13px] text-stone-600 group-hover:text-stone-900">
            Read the study &rarr;
          </span>
        </a>
      </section>
    </main>
  );
}
