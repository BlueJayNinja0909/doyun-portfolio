import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carbon to fuel — Doyun Lee',
  description: 'An illustrated case study of landfill CO₂-to-ethanol process design and feasibility research.',
};

const steps = [
  ['01', 'RNG tail gas', 'CO₂-rich off-gas from landfill-gas upgrading'],
  ['02', 'Condition', 'Compress, dry and remove contaminants'],
  ['03', 'Electrolyze', 'Convert part of the carbon into ethanol'],
  ['04', 'Recover', 'Recycle gas and separate ethanol from water'],
  ['05', 'Sell ethanol', 'Any later fuel conversion happens elsewhere'],
];
const metrics = [
  ['250', 'kg CO₂ / hour', 'Fresh feed design basis'],
  ['52%', 'ethanol FE', 'Literature-based input'],
  ['≈441', 'cells', 'Estimated stack'],
  ['≈330', 'tonnes / year', 'Modeled saleable ethanol'],
];

export default function CarbonToFuelPage() {
  return <main className="carbon-page pb-28">
    <div className="mx-auto max-w-6xl px-6 pt-8"><a href="/" className="text-xs text-stone-600 hover:text-stone-950">← Back to all work</a></div>
    <header className="carbon-hero relative mx-auto mt-8 max-w-6xl overflow-hidden rounded-[1.75rem] px-7 py-14 text-[#ecf3e9] sm:px-12 lg:px-16">
      <div className="relative z-10 max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#b4d7bb]">Case study 01 / Research internship / Summer 2026</p>
        <h1 className="mt-7 max-w-[12ch] font-serif text-[clamp(3.25rem,8vw,6.5rem)] leading-[0.99] tracking-[-0.045em]">Carbon into something useful.</h1>
        <p className="mt-7 max-w-xl text-[17px] leading-relaxed text-[#ceddd2]">Could waste CO₂ from landfill-gas upgrading become saleable ethanol? We built a conceptual plant and followed the engineering all the way to the economics.</p>
        <div className="mt-9 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.11em]"><span className="carbon-tag">Electrochemistry</span><span className="carbon-tag">Process design</span><span className="carbon-tag">Techno-economics</span></div>
      </div>
      <div className="carbon-orbit carbon-orbit-one" aria-hidden="true"/><div className="carbon-orbit carbon-orbit-two" aria-hidden="true"/>
      <div className="carbon-molecule" aria-hidden="true">CO₂ <span>↗</span> C₂H₅OH</div>
    </header>
    <section className="carbon-section">
      <div className="grid gap-6 md:grid-cols-[1.1fr_0.9fr] md:items-end"><div><p className="carbon-eyebrow">01 / At a glance</p><h2 className="carbon-heading">A plant on paper. A real feasibility question.</h2></div><p className="max-w-md text-[15px] leading-relaxed text-stone-600">At CincyCarbon, our four-intern team examined an electrochemical process, reconciled research assumptions and tested whether it could make economic sense.</p></div>
      <div className="mt-9 grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(([value,unit,note])=><div key={unit} className="rounded-2xl border border-[#d9e1d9] bg-white/80 p-5 sm:p-6"><p className="font-serif text-4xl tracking-tight text-[#245747] sm:text-5xl">{value}</p><p className="mt-2 text-sm font-semibold">{unit}</p><p className="mt-3 text-xs text-stone-500">{note}</p></div>)}</div>
      <p className="mt-3 text-xs text-stone-500">All figures are conceptual model estimates, not operating-plant measurements. Annual output assumes 85% ethanol recovery and 90% availability.</p>
    </section>
    <section className="carbon-section">
      <p className="carbon-eyebrow">02 / Process architecture</p><h2 className="carbon-heading">Follow the carbon.</h2>
      <p className="mt-4 text-sm text-stone-600">A simplified visual reconstruction of our final process-flow design.</p>
      <div className="mt-7 rounded-[1.5rem] border border-[#d6e0d7] bg-[#eaf1e9] p-5 sm:p-8"><div className="grid gap-3 md:grid-cols-5">{steps.map(([num,title,desc],i)=><div key={num} className="relative rounded-xl border border-[#c7d7c8] bg-[#fcfdf9] p-5"><span className="text-xs font-semibold tracking-[0.12em] text-[#5c9272]">{num}</span><h3 className="mt-6 min-h-16 font-serif text-2xl leading-tight text-[#173f33]">{title}</h3><p className="mt-3 text-xs leading-relaxed text-stone-600">{desc}</p>{i<4&&<span aria-hidden="true" className="absolute -right-3 top-1/2 z-10 hidden h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#245747] text-white md:flex">→</span>}</div>)}</div><div className="mt-5 rounded-xl bg-[#dce9dd] px-5 py-4 text-xs leading-relaxed text-[#245747]"><strong className="mr-3 uppercase tracking-wider">↶ Recycle loop</strong> Unreacted CO₂ is recovered where possible; membrane crossover and purge losses still matter.</div></div>
    </section>
    <section className="carbon-section">
      <p className="carbon-eyebrow">03 / Revisions</p><h2 className="carbon-heading">Better evidence changed the numbers.</h2>
      <div className="mt-8 grid gap-4 lg:grid-cols-2"><div className="rounded-[1.5rem] bg-[#143f34] p-7 text-[#edf5eb] sm:p-9"><p className="text-xs uppercase tracking-[0.17em] text-[#a3cbb2]">Midpoint → final</p><p className="mt-8 text-sm text-[#c3d8c9]">Ethanol Faradaic efficiency</p><div className="mt-2 flex items-end gap-4"><span className="font-serif text-5xl text-[#9bb1a6] line-through">55%</span><span className="mb-2">→</span><span className="font-serif text-6xl">52%</span></div><div className="my-8 h-px bg-white/20"/><p className="text-sm text-[#c3d8c9]">Gross → saleable ethanol (kg/hour)</p><div className="mt-2 flex items-end gap-4"><span className="font-serif text-5xl">49.3</span><span className="mb-2">→</span><span className="font-serif text-5xl text-[#b7e3ba]">41.9</span></div><p className="mt-5 text-xs leading-relaxed text-[#c3d8c9]">52% FE is literature-based. The 85% recovery factor is a planning assumption from related research, not a measurement of this integrated process.</p></div>
      <div className="flex flex-col justify-between rounded-[1.5rem] border border-[#d9e1d9] bg-[#f2f3ed] p-7 sm:p-9"><div><p className="text-xs uppercase tracking-[0.17em] text-stone-500">The lesson</p><h3 className="mt-5 font-serif text-3xl leading-tight">Reactor output is not the same as revenue.</h3><p className="mt-5 text-[15px] leading-relaxed text-stone-700">Recovery, uptime, feed purity, crossover and transportation affect what can actually be sold. We widened our feed concentration assumption to 80–92% CO₂ after correspondence about one RNG facility.</p></div><p className="mt-10 border-t border-stone-300 pt-5 text-xs text-stone-500">Site correspondence is not a supply agreement, a guaranteed price, or evidence about every RNG plant.</p></div></div>
    </section>
    <section className="carbon-section">
      <p className="carbon-eyebrow">04 / Unit economics</p><h2 className="carbon-heading">The electricity bill changes the story.</h2><p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-stone-600">At a modeled $0.03/kWh, electricity alone costs more than our estimated market value of ethanol—before capital, maintenance or labor.</p>
      <div className="mt-8 rounded-[1.5rem] border border-[#d9e1d9] bg-white p-6 sm:p-9"><p className="text-xs uppercase tracking-[0.13em] text-stone-500">US dollars per tonne of saleable ethanol / illustrative scenario</p><div className="mt-9 space-y-7"><div><div className="mb-2 flex justify-between text-sm"><span>Ethanol benchmark</span><strong>$670</strong></div><div className="h-8 rounded-r bg-[#e6eee5]"><div className="h-full w-[28%] rounded-r bg-[#79aa8a]"/></div></div><div><div className="mb-2 flex justify-between gap-3 text-sm"><span>Modeled electricity cost</span><strong>$1,846–$2,368</strong></div><div className="h-8 rounded-r bg-[#e6eee5]"><div className="h-full w-full rounded-r bg-[#245747]"/></div></div></div><div className="mt-9 grid gap-6 border-t border-stone-200 pt-7 sm:grid-cols-2"><div><p className="font-serif text-4xl text-[#245747]">0.85–1.09¢</p><p className="mt-2 text-sm text-stone-600">Electricity-only break-even price per kWh</p></div><div><p className="font-serif text-4xl text-[#245747]">$221k</p><p className="mt-2 text-sm text-stone-600">Estimated annual gross ethanol revenue at benchmark</p></div></div><p className="mt-7 text-xs text-stone-500">These numbers are modeled scenarios, not actual company financials or buyer quotes.</p></div>
    </section>
    <section className="carbon-section grid gap-10 lg:grid-cols-[0.75fr_1.25fr]"><div><p className="carbon-eyebrow">05 / My contribution</p><h2 className="carbon-heading">From assumptions to decisions.</h2></div><div className="space-y-5 text-[15px] leading-relaxed text-stone-700"><p>I helped connect the technical model to the business case: comparing conversion-efficiency research, considering stack sizing and recovery, and examining electricity, CO₂ transportation and buyer requirements.</p><p>Our team concluded that the process deserved smaller-scale testing—not immediate commercial construction. Longer durability trials, real feed-gas data and an actual buyer specification are still needed.</p><blockquote className="rounded-xl border-l-4 border-[#317052] bg-[#ebf2e9] p-5 font-serif text-xl text-[#224d3c]">“Can it work?” became “Under which assumptions could the whole system work?”</blockquote><p className="text-xs text-stone-500">Adapted from the team's September 2026 final deck and design notes. Visuals here are simplified reconstructions. This is not a validated commercial design.</p></div></section>
  </main>;
}
