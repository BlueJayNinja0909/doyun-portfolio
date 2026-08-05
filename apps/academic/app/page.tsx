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
    period: '2026',
    title: 'Research intern, Cincy Carbon',
    body:
      'Through Ladder Internships, on sustainable aviation fuel and carbon-to-fuel ' +
      'pathways.',
  },
  {
    period: 'Aug 2025 to present',
    title: 'Vice president, RBHS Taekwondo Club',
    body:
      'Co-leads biweekly meetings on taekwondo culture and history, and coordinates ' +
      'monthly joint practices with clubs from other schools.',
  },
  {
    period: 'Jun 2025 to present',
    title: 'Referee, Federal Taekwondo Association',
    body:
      'Officiates regional matches. Received the association&rsquo;s Volunteer Appreciation ' +
      'Award for the 2026 San Diego Open.',
  },
  {
    period: 'Apr 2022 to present',
    title: 'Special needs assistant, Elite Taekwondo Academy',
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
    title: 'Royal Regiment and Symphonic Band',
    body:
      'Marching band in SCSBOA Division 6A, the highest competitive division, and second ' +
      'chair clarinet. Performed at Carnegie Hall in April 2026.',
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
  { name: 'Rising Performer Award, RBHS', scope: 'School, 2025' },
];

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
            Genesis Bloom is a Roblox game built solo across 25 stages, where answering a
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
