/**
 * What is on this page and what is deliberately not.
 *
 * Included: projects, research, leadership, service, athletics, music, awards.
 * Everything an outside reader can act on or verify.
 *
 * Left off: GPA and individual AP scores. They are on the resume because a resume
 * goes to admissions officers who will see the transcript regardless. A public page
 * is read by a different audience, keeps whatever it says permanently and
 * searchably, and gains nothing from a number that is either redundant to the people
 * who matter or context-free to everyone else. Easy to add back if Doyun disagrees;
 * much harder to un-publish.
 */

type Entry = { period: string; title: string; body: string };

const BACKGROUND: Entry[] = [
  {
    period: '2026–present',
    title: 'Co-president and founder, RBHS Keyboard Club',
    body:
      'Co-founded a hands-on mechanical keyboard club with 40+ student sign-ups. ' +
      'Organizes workshops and sponsor-supported switch and keycap demonstrations; ' +
      'developing a custom 3×3 macropad.',
  },
  {
    period: 'Aug 2025 to present',
    title: 'Vice president, RBHS Taekwondo Club',
    body:
      'Co-leads biweekly meetings on taekwondo culture and history, and coordinates ' +
      'monthly joint practices with clubs from other schools.',
  },
  {
    period: '2024 to present',
    title: 'Referee, Federal Taekwondo Association',
    body:
      'Officiates taekwondo matches as a paid referee and holds a USA Taekwondo ' +
      'D-Level Kyorugi referee certification.',
  },
  {
    period: '2021 to present',
    title: 'Volunteer instructor, Taekwondo',
    body:
      'Works with children with autism and ADHD in both inclusive and regular classes, ' +
      'adapting how a lesson is taught to how a given student learns.',
  },
  {
    period: 'Sep 2024 to May 2026',
    title: 'Assistant teacher, San Diego Korean School',
    body: 'Supports lessons and younger students. Received the school&rsquo;s Student Leadership Award.',
  },
  {
    period: 'Jul 2025',
    title: 'United States delegate, Overseas Koreans Agency',
    body:
      'Selected for a fully funded programme in Korea, in leadership forums and cultural ' +
      'exchange with more than 200 peers from around the world.',
  },
  {
    period: '2017 to present',
    title: 'Taekwondo, 3rd Dan',
    body:
      'Gold at the AAU Region 13 Championship and silver at the AAU National ' +
      'Championships in Olympic-style sparring. Training toward Kukkiwon 4th Dan.',
  },
  {
    period: '2023 to present',
    title: 'Royal Regiment and Wind Ensemble',
    body:
      'Clarinetist in marching band and Wind Ensemble. Performed at Carnegie Hall in April ' +
      '2026 and placed fifth among more than 30 clarinetists in the band programme.',
  },
];

const AWARDS: { name: string; scope: string }[] = [
  { name: 'President&rsquo;s Volunteer Service Award, Gold', scope: 'National, 2024' },
  { name: 'AP Scholar with Honor', scope: 'National, 2026' },
  { name: 'Silver, AAU National Taekwondo Championships', scope: 'National, 2026' },
  { name: 'Gold, AAU Region 13 Championship', scope: 'Regional, 2026' },
  { name: 'Senator&rsquo;s Award, Youth Money Camp', scope: 'State, 2026' },
  { name: 'Student Leadership Award, San Diego Korean School', scope: 'Regional, 2026' },
  { name: 'Volunteer Appreciation Award, Federal Taekwondo Association', scope: 'Regional, 2026' },
  { name: 'Certificate of Recognition, County of San Diego', scope: 'Regional, 2024' },
  { name: 'Outstanding Leadership Award, California State Assembly', scope: 'State, 2026' },
  { name: 'Next Generation Leadership Award, Korean Education Center LA', scope: 'Regional, 2026' },
  { name: 'Rising Performer Award, RBHS', scope: 'School, 2025' },
];

export default function Page() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-24">
      <header className="pt-12">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.19em] text-[#3c7358]">Research · Engineering · Design</p>
        {/* LCP element — not animated. */}
        <h1 className="font-serif text-[clamp(2rem,7vw,3.25rem)] leading-[1.08] tracking-[-0.015em]">
          Doyun Lee
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-stone-700">
          I like finding the assumptions hiding inside a problem, then testing them with data
          or a working prototype. I&rsquo;m a senior at Rancho Bernardo High School in San Diego,
          interested in economics, engineering and the systems that shape everyday life.
        </p>
      </header>

      <section className="mt-14 border-t border-stone-200 pt-10">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-stone-600">Work</h2>

        <a href="/work/carbon-to-fuel/" className="group relative mt-6 block overflow-hidden rounded-2xl bg-[#173f33] p-7 text-[#f0f5ed] transition-transform hover:-translate-y-1 sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border border-[#afd8b44d]" aria-hidden="true"/>
          <div className="pointer-events-none absolute -right-4 -top-12 h-48 w-48 rounded-full border border-[#afd8b44d]" aria-hidden="true"/>
          <p className="relative text-[11px] uppercase tracking-[0.14em] text-[#b1d8bc]">
            Research internship &middot; Summer 2026
          </p>
          <h3 className="relative mt-4 max-w-lg font-serif text-3xl leading-snug tracking-[-0.02em] group-hover:underline">
            Can turning captured CO₂ into fuel make economic sense?
          </h3>
          <p className="relative mt-4 max-w-xl text-[15px] leading-relaxed text-[#d1e0d4]">
            At CincyCarbon, I helped a four-intern team examine electrochemical CO₂-to-ethanol
            production: Faradaic efficiency, stack sizing, separation, electricity costs and
            the conditions a real plant would need to break even.
          </p>
          <span className="relative mt-7 inline-block rounded-full border border-[#a6cbb5] px-4 py-2 text-[13px] text-[#e6f4e9] group-hover:bg-[#ffffff20]">
            Explore case study &rarr;
          </span>
        </a>

        <a
          href="/work/transit-vs-driving/"
          className="group mt-8 block border-b border-stone-200 pb-8"
        >
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
            Independent research &middot; 2026
          </p>
          <h3 className="mt-2 font-serif text-2xl leading-snug tracking-[-0.01em] group-hover:underline">
            In San Diego, the electric car is cleaner than the bus.
          </h3>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-stone-700">
            Four Rancho Bernardo routes measured door to door for cost, time and carbon, plus a
            local survey on why people drive anyway. I presented the findings to the Rancho
            Bernardo Community Council, including a school route with 42 minutes of walking.
          </p>
          <span className="mt-3 inline-block text-[13px] text-stone-600 group-hover:text-stone-900">
            Read the study &rarr;
          </span>
        </a>

        {/* Genesis Bloom sits under Work rather than in the list below because it is a
            finished thing someone can go and use, which is a different claim from a
            role held. The Roblox URL is the bare game link: the one on the resume
            carried a homePageSessionInfo token and a dozen other tracking parameters
            from wherever it was copied. */}
        <div className="mt-8 border-b border-stone-200 pb-8">
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
            Independent project &middot; December 2025
          </p>
          <h3 className="mt-2 font-serif text-2xl leading-snug tracking-[-0.01em]">
            An obstacle course that only opens if you can do the calculus.
          </h3>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-stone-700">
            Genesis Bloom is a Roblox game built solo across 30 stages, where answering a
            curriculum-aligned AP Calculus question is what unlocks the next one. Every system is
            mine: the Lua for checkpoints, multiplayer and saved progress, the interface, the map,
            and the effects work throughout.
          </p>
          <a
            href="https://www.roblox.com/games/132575205525756/Genesis-Bloom"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-[13px] text-stone-600 underline-offset-4 hover:text-stone-900 hover:underline"
          >
            Play it on Roblox &rarr;
          </a>
        </div>

        <div className="mt-8 border-b border-stone-200 pb-8">
          <p className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
            Design and engineering &middot; 2026–present
          </p>
          <h3 className="mt-2 font-serif text-2xl leading-snug tracking-[-0.01em]">
            Building a keyboard club, then building our own macropad.
          </h3>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-stone-700">
            I co-founded the RBHS Keyboard Club to make a niche hobby accessible to more
            students. We secured support from keyboard brands, organized hands-on activities,
            and began designing a 3×3 USB-C, hot-swap macropad with a 3D-printed case.
            It&rsquo;s an ongoing build, not a finished product.
          </p>
        </div>
      </section>

      <section className="mt-14 border-t border-stone-200 pt-10">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-stone-600">Background</h2>
        <dl className="mt-6 space-y-7">
          {BACKGROUND.map(({ period, title, body }) => (
            <div key={title}>
              <dt>
                <span className="text-[11px] uppercase tracking-[0.14em] text-stone-500">
                  {period}
                </span>
                <span className="mt-1 block font-serif text-lg leading-snug tracking-[-0.01em]">
                  {title}
                </span>
              </dt>
              <dd
                className="mt-2 max-w-xl text-[15px] leading-relaxed text-stone-700"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14 border-t border-stone-200 pt-10">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-stone-600">Awards</h2>
        <ul className="mt-6 space-y-3">
          {AWARDS.map(({ name, scope }) => (
            <li
              key={name}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-stone-100 pb-3"
            >
              <span
                className="text-[15px] leading-relaxed text-stone-800"
                dangerouslySetInnerHTML={{ __html: name }}
              />
              <span className="text-[12px] uppercase tracking-[0.12em] text-stone-500">{scope}</span>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
