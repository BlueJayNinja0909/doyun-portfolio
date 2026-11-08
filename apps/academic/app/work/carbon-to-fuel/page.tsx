import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carbon-to-fuel feasibility — Doyun Lee',
  description: 'Research internship notes on the engineering and economics of converting captured CO₂ into ethanol.',
};

const QUESTIONS = [
  {
    number: '01',
    title: 'How much of the electrical input becomes the product we want?',
    body: 'We reviewed Faradaic efficiency estimates and reconciled differences between published studies before using them in stack-sizing calculations.',
  },
  {
    number: '02',
    title: 'What happens after the reactor?',
    body: 'Product recovery, crossover and separation requirements matter. A promising conversion result is not automatically a viable production process.',
  },
  {
    number: '03',
    title: 'When do the economics change?',
    body: 'We compared possible ethanol revenue with electricity and transportation costs, tested break-even electricity assumptions and considered co-location to reduce CO₂ transport.',
  },
];

export default function CarbonToFuelPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-24">
      <a href="/" className="mt-8 inline-block text-xs text-stone-600 underline-offset-4 hover:underline">
        &larr; All work
      </a>
      <header className="mt-12">
        <p className="text-[11px] uppercase tracking-[0.17em] text-stone-500">
          Research internship &middot; CincyCarbon / Ladder Internships &middot; Summer 2026
        </p>
        <h1 className="mt-4 max-w-2xl font-serif text-[clamp(2.1rem,6vw,3.5rem)] leading-[1.12] tracking-[-0.02em]">
          The hard part of carbon-to-fuel is not just making the fuel.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-stone-700">
          It&rsquo;s finding a process that can make enough of it, recover it, and sell it for
          more than it costs to produce.
        </p>
      </header>

      <section className="mt-14 border-t border-stone-200 pt-9">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-stone-600">The project</h2>
        <div className="prose-study mt-6 text-[15px] text-stone-800">
          <p>
            I worked on a four-intern research team studying an electrochemical pathway from
            captured carbon dioxide to ethanol, a potential intermediate in sustainable fuel
            production. My work focused on connecting technical assumptions to the commercial
            picture: conversion efficiency, equipment sizing, product recovery, and cost.
          </p>
          <p>
            Published studies did not always agree. Rather than treating one figure as a
            universal constant, we compared assumptions and examined how sensitive the
            conclusions were to them.
          </p>
        </div>
      </section>

      <section className="mt-14 border-t border-stone-200 pt-9">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-stone-600">Three questions we tested</h2>
        <div className="mt-7 space-y-8">
          {QUESTIONS.map(({ number, title, body }) => (
            <div key={number} className="grid gap-3 border-b border-stone-200 pb-7 sm:grid-cols-[3rem_1fr]">
              <span className="font-serif text-xl text-stone-400">{number}</span>
              <div>
                <h3 className="font-serif text-xl leading-snug">{title}</h3>
                <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-stone-700">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <aside className="mt-12 border-l-2 border-stone-800 pl-6">
        <p className="text-[11px] uppercase tracking-[0.18em] text-stone-600">A useful reality check</p>
        <p className="mt-3 font-serif text-2xl leading-snug">
          At an illustrative electricity price of $0.03/kWh, the estimated electricity cost
          alone was roughly three times the benchmark value of the ethanol output.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-stone-600">
          This was a scenario within our analysis, not a universal result or a claim about
          CincyCarbon&rsquo;s actual operating costs.
        </p>
      </aside>

      <section className="mt-14 border-t border-stone-200 pt-9">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-stone-600">What I took away</h2>
        <div className="prose-study mt-6 text-[15px] text-stone-800">
          <p>
            The most interesting question changed from whether the chemistry worked to
            which combinations of electricity price, efficiency, recovery and location
            could make the whole system plausible. That shift—from a headline result to
            the assumptions underneath it—is what made the project stick with me.
          </p>
          <p>
            This page is a summary of my research experience. It does not disclose
            proprietary company material or present the work as a commercial design.
          </p>
        </div>
      </section>
    </main>
  );
}
