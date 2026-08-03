import {
  loadRoutes,
  loadCost,
  loadEmissions,
  loadBarriers,
  route1Breakdown,
  totalRespondents,
  assumption,
} from '@/lib/transit';
import { TripBreakdown } from '@/components/TripBreakdown';
import { CostChart } from '@/components/CostChart';
import { EmissionsChart } from '@/components/EmissionsChart';

export default function Page() {
  const routes = loadRoutes();
  const cost = loadCost();
  const emissions = loadEmissions();
  const barriers = loadBarriers();
  const trip = route1Breakdown();
  const n = totalRespondents();

  const route1 = routes.find((r) => r.route === 1)!;
  const downtown = cost.find((c) => c.route === 3)!;
  const gasFactor = assumption('Gas Car').value;
  const evFactor = assumption('Electric Car (SDG&E grid)').value;
  const busFactor = assumption('Transit Bus (per passenger)').value;

  // Routes where the destination charges for parking, read from the study's own
  // assumptions rather than hardcoded.
  const parkingRoutes = [3, 4];

  const wouldRideMore = barriers.find((b) => b.barrier !== 'no barrier');

  return (
    <main className="mx-auto max-w-3xl px-6 pb-24">
      <header className="border-b border-stone-200 pb-10">
        <p className="text-[11px] uppercase tracking-[0.18em] text-stone-600">
          Independent research &middot; June 2025
        </p>
        {/* LCP element — deliberately not animated. Fluid type so a single long line
            never forces a narrow phone to scroll sideways. */}
        <h1 className="mt-5 font-serif text-[clamp(2rem,7vw,3.25rem)] leading-[1.08] tracking-[-0.015em]">
          In San Diego, the electric car is cleaner than the bus.
        </h1>
        <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-stone-700">
          I measured four Rancho Bernardo trips door to door — cost, time and carbon — and
          surveyed {n} neighbours about why they drive. Two of the three findings went against
          what I expected.
        </p>
      </header>

      <section className="pt-14">
        <h2 className="font-serif text-2xl tracking-[-0.01em]">The bus is four minutes long</h2>
        <div className="prose-study mt-5 text-[15px] text-stone-800">
          <p>
            Route 1 is the trip I make most: home to Rancho Bernardo High School, {route1.miles}{' '}
            miles. By car it takes {route1.driveTime}. By transit it takes {trip.total} minutes,
            and Route 945 runs the whole way with no transfers.
          </p>
          <p>
            That framing hides the problem. Almost all of that time is spent on foot.
          </p>
        </div>

        <TripBreakdown trip={trip} driveMinutes={route1.driveTime} />

        <div className="prose-study text-[15px] text-stone-800">
          <p>
            This reframes what the study is even about. Transit here is not slow because the
            buses are slow — the bus is four minutes. It is slow because the network is out of
            reach from either end. That is a first- and last-mile problem, and it is fixable
            without touching the bus route at all.
          </p>
        </div>
      </section>

      <section className="pt-16">
        <h2 className="font-serif text-2xl tracking-[-0.01em]">Parking decides the cost</h2>
        <div className="prose-study mt-5 text-[15px] text-stone-800">
          <p>
            I expected transit to be cheaper everywhere. It is not. On short trips ending
            somewhere with free parking — school, the gym — driving costs about a dollar and
            transit costs {'$'}
            {cost[0].transit.toFixed(2)}. Paying a flat fare to save a dollar of fuel makes no
            sense, and residents know it.
          </p>
          <p>
            The moment a destination charges for parking, the arithmetic inverts. Downtown, the{' '}
            {'$'}
            {assumption('Downtown SD - 1048 Seventh Ave').value} parking fee swamps the fuel
            difference: driving costs {'$'}
            {downtown.gas.toFixed(2)} round trip against {'$'}
            {downtown.transit.toFixed(2)} by bus.
          </p>
        </div>

        <CostChart rows={cost} parkingRoutes={parkingRoutes} />
      </section>

      <section className="pt-16">
        <h2 className="font-serif text-2xl tracking-[-0.01em]">
          The surprising one: the bus is not the cleanest option
        </h2>
        <div className="prose-study mt-5 text-[15px] text-stone-800">
          <p>
            A gas car emits {gasFactor} lbs of CO<sub>2</sub> per mile. A transit bus, per
            passenger, emits {busFactor}. An electric car charged on San Diego&rsquo;s grid emits{' '}
            {evFactor} — about a quarter less than the bus.
          </p>
          <p>
            This is a local result, not a general one. SDG&amp;E&rsquo;s grid carries a high
            renewable share, so the electricity going into the car is unusually clean. Run the
            same comparison somewhere coal-heavy and the bus wins comfortably.
          </p>
        </div>

        <EmissionsChart gas={gasFactor} transit={busFactor} ev={evFactor} />
      </section>

      <section className="pt-16">
        <h2 className="font-serif text-2xl tracking-[-0.01em]">What {n} neighbours said</h2>
        <div className="prose-study mt-5 text-[15px] text-stone-800">
          <p>
            I asked {n} people around Rancho Bernardo what stops them using transit. The answers
            were not about money.
          </p>
        </div>

        <div className="my-10 space-y-2">
          {barriers.map((b) => (
            <div key={b.barrier} className="sm:flex sm:items-center sm:gap-4">
              <span className="block text-sm capitalize text-stone-700 sm:w-28 sm:shrink-0 sm:text-right">
                {b.barrier}
              </span>
              <div className="mt-1 h-6 bg-stone-200/60 sm:mt-0 sm:flex-1">
                <div
                  className="h-full bg-[#3F6D8C]"
                  style={{ width: `${(b.responses / n) * 100}%` }}
                />
              </div>
              <span className="mt-1 block text-xs tabular-nums text-stone-600 sm:mt-0 sm:w-24 sm:shrink-0">
                {b.responses} of {n}
              </span>
            </div>
          ))}
        </div>

        <div className="prose-study text-[15px] text-stone-800">
          <p>
            Convenience led at {wouldRideMore?.responses} of {n}, and when people explained what
            they meant it was almost always distance to a stop: a 0.9-mile walk at each end, a
            stop too far for someone with bad knees, a route that doesn&rsquo;t work with a
            stroller. Cost was named once.
          </p>
        </div>
      </section>

      <section className="pt-16">
        <h2 className="font-serif text-2xl tracking-[-0.01em]">What would actually help</h2>
        <div className="prose-study mt-5 text-[15px] text-stone-800">
          <p>
            All three findings point the same way. The bus itself is fine. Reaching it is the
            problem, and the fixes are about closing that gap rather than adding service.
          </p>
        </div>

        <ol className="my-8 space-y-5">
          {[
            {
              title: 'Increase Route 945 frequency at peak',
              body: 'Reduce wait times from 30 minutes to 15 during the hours students and workers actually travel. Time was the second most cited barrier.',
            },
            {
              title: 'A first- and last-mile neighbourhood shuttle',
              body: `The single highest-value change. A small connector feeding Route 945 attacks the 42 minutes of walking directly — the 4-minute bus ride is not the problem.`,
            },
            {
              title: 'Employer transit partnerships',
              body: 'Several respondents named free workplace parking as the reason driving wins. Large Rancho Bernardo employers subsidising passes would change that calculation without any new infrastructure.',
            },
          ].map((rec, i) => (
            <li key={rec.title} className="flex gap-4">
              <span className="w-6 shrink-0 pt-0.5 font-serif text-lg text-stone-500 tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h3 className="text-[15px] font-semibold text-stone-900">{rec.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-stone-700">{rec.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 border-t border-stone-200 pt-10">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-stone-600">Method</h2>
        <div className="prose-study mt-4 text-[13px] leading-relaxed text-stone-600">
          <p>
            Four routes measured door to door in June 2025 using Google Maps and MTS schedules.
            Costs are round trip and include parking where charged; emissions are one way.
            Prices and factors are listed below and every figure on this page is computed from
            them.
          </p>
          <p>
            Survey responses were collected in person from {n} Rancho Bernardo residents. It is
            a convenience sample, not a representative one, and the numbers should be read as
            indicative rather than statistically robust.
          </p>
        </div>

        <dl className="mt-6 grid grid-cols-1 gap-x-8 gap-y-2 text-[13px] sm:grid-cols-2">
          {[
            ['Gas price', '$5.49/gal', 'Costco San Diego, Jun 2025'],
            ['Gas car', '28 MPG', 'typical sedan or SUV'],
            ['EV efficiency', '3.5 mi/kWh', 'EPA average'],
            ['Electricity', '$0.45/kWh', 'SDG&E estimate'],
            ['Transit fare', '$2.50/ride', 'MTS single ride'],
            ['Downtown parking', '$20/day', 'estimated $15–$35'],
          ].map(([k, v, note]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-stone-200 py-1.5">
              <dt className="text-stone-600">{k}</dt>
              <dd className="text-right text-stone-800">
                {v} <span className="text-stone-500">&middot; {note}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
