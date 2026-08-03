import { beforeAll, describe, expect, test } from 'vitest';
import path from 'node:path';

// lib/transit.ts resolves content from process.cwd(), which is the app directory under
// `next build` but the repo root under vitest. Point cwd at the app for these tests.
const APP_DIR = path.join(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')),
  '../..',
);

let T: typeof import('../transit');

beforeAll(async () => {
  process.chdir(APP_DIR);
  T = await import('../transit');
});

describe('route 1 breakdown — the study\'s lead finding', () => {
  test('is parsed from the route description, not hardcoded', () => {
    const b = T.route1Breakdown();
    expect(b).toEqual({ walkTo: 21, bus: 4, walkFrom: 21, total: 46 });
  });

  test('the walking dominates the ride', () => {
    const b = T.route1Breakdown();
    expect(b.walkTo + b.walkFrom).toBe(42);
    expect(b.bus).toBeLessThan(5);
  });

  test('the segments account for the stated total', () => {
    const b = T.route1Breakdown();
    // 21 + 4 + 21 = 46. If the source description is ever edited inconsistently,
    // this catches it before the chart renders a bar that does not add up.
    expect(b.walkTo + b.bus + b.walkFrom).toBe(b.total);
  });
});

describe('survey', () => {
  test('barriers sum to the stated 16 respondents', () => {
    expect(T.totalRespondents()).toBe(16);
  });

  test('safety is 2, not the 3 the summary document claims', () => {
    // The .docx version of the writeup says 3. Recounting the raw responses gives 2;
    // the infographic and community guide both already say 2. This pins the correct
    // figure so the site cannot drift back to the wrong one.
    const safety = T.loadBarriers().find((b) => b.barrier === 'safety');
    expect(safety?.responses).toBe(2);
  });

  test('convenience is the leading barrier', () => {
    expect(T.loadBarriers()[0].barrier).toBe('convenience');
  });
});

describe('the study\'s arithmetic holds against its own assumptions', () => {
  // These recompute the published figures from the stated inputs. If someone edits a
  // price or an efficiency without regenerating the derived files, the site would
  // otherwise show a chart that quietly disagrees with its own methodology section.
  test('driving cost matches gas price, MPG and parking', () => {
    const gasPrice = T.assumption('Gas Price - Costco').value;
    const mpg = T.assumption('Gas Car MPG (assumed)').value;
    const parkingDowntown = T.assumption('Downtown SD - 1048 Seventh Ave').value;

    const routes = T.loadEmissions();
    const cost = T.loadCost();

    const school = routes.find((r) => r.route === 1)!;
    const expectedSchool = (school.miles / mpg) * gasPrice * 2; // round trip, free parking
    expect(cost.find((c) => c.route === 1)!.gas).toBeCloseTo(expectedSchool, 2);

    const downtown = routes.find((r) => r.route === 3)!;
    const expectedDowntown = (downtown.miles / mpg) * gasPrice * 2 + parkingDowntown;
    expect(cost.find((c) => c.route === 3)!.gas).toBeCloseTo(expectedDowntown, 2);
  });

  test('EV cost matches efficiency and electricity rate', () => {
    const miPerKwh = T.assumption('EV Efficiency (Tesla / Ioniq 5)').value;
    const rate = T.assumption('SDG&E Electricity Rate (est.)').value;
    const parking = T.assumption('Downtown SD - 1048 Seventh Ave').value;

    const downtown = T.loadEmissions().find((r) => r.route === 3)!;
    const expected = (downtown.miles / miPerKwh) * rate * 2 + parking;
    expect(T.loadCost().find((c) => c.route === 3)!.ev).toBeCloseTo(expected, 2);
  });

  test('emissions match the per-mile factors, one way', () => {
    const gasFactor = T.assumption('Gas Car').value;
    const evFactor = T.assumption('Electric Car (SDG&E grid)').value;
    const busFactor = T.assumption('Transit Bus (per passenger)').value;

    for (const r of T.loadEmissions()) {
      expect(r.gas, `${r.label} gas`).toBeCloseTo(r.miles * gasFactor, 2);
      expect(r.ev, `${r.label} ev`).toBeCloseTo(r.miles * evFactor, 2);
      expect(r.transit, `${r.label} transit`).toBeCloseTo(r.miles * busFactor, 2);
    }
  });

  test('the counterintuitive finding holds: an EV emits less per mile than a bus seat', () => {
    const ev = T.assumption('Electric Car (SDG&E grid)').value;
    const bus = T.assumption('Transit Bus (per passenger)').value;
    expect(ev).toBeLessThan(bus);
    // And it is not a rounding artefact — it is a ~28% gap.
    expect((bus - ev) / bus).toBeGreaterThan(0.2);
  });

  test('transit still wins on cost downtown, where parking applies', () => {
    const downtown = T.loadCost().find((c) => c.route === 3)!;
    expect(downtown.transit).toBeLessThan(downtown.ev);
    expect(downtown.ev).toBeLessThan(downtown.gas);
  });

  test('driving wins on cost for short trips with free parking', () => {
    const school = T.loadCost().find((c) => c.route === 1)!;
    expect(school.ev).toBeLessThan(school.transit);
    expect(school.gas).toBeLessThan(school.transit);
  });
});
