import fs from 'node:fs';
import path from 'node:path';
import { parseCsvRecords, num } from './csv';

/**
 * Typed access to the Public Transit vs Driving study (Rancho Bernardo, June 2025).
 *
 * The CSVs are the single source of truth. Nothing here hardcodes a figure that also
 * appears in the data — a chart and a sentence disagreeing is the specific failure
 * this layer exists to prevent.
 *
 * Units differ between files and it matters:
 *  - cost.csv is ROUND TRIP dollars, and includes parking where it applies
 *  - emissions.csv is ONE WAY pounds of CO2
 * Both are as the study computed them; see the arithmetic tests.
 */

const DIR = path.join(process.cwd(), 'content/transit');
const read = (f: string) => fs.readFileSync(path.join(DIR, f), 'utf8');

export type Route = {
  route: number;
  label: string;
  endpoints: string;
  miles: number;
  driveTime: string;
  transit: string;
  extraMinutes: string;
};

export type CostRow = { route: number; label: string; gas: number; ev: number; transit: number };
export type EmissionsRow = {
  route: number;
  label: string;
  miles: number;
  gas: number;
  ev: number;
  transit: number;
};
export type Barrier = { barrier: string; responses: number };
export type Assumption = { parameter: string; value: number; source: string };

export function loadRoutes(): Route[] {
  return parseCsvRecords(read('routes.csv')).map((r) => ({
    route: num(r.route, 'routes.route'),
    label: r.label,
    endpoints: r.endpoints,
    miles: num(r.miles, `routes.miles (${r.label})`),
    driveTime: r.drive_time_a,
    transit: r.transit,
    extraMinutes: r.extra_minutes,
  }));
}

export function loadCost(): CostRow[] {
  return parseCsvRecords(read('cost.csv')).map((r) => ({
    route: num(r.route, 'cost.route'),
    label: r.label,
    gas: num(r.gas_car, `cost.gas_car (${r.label})`),
    ev: num(r.ev, `cost.ev (${r.label})`),
    transit: num(r.transit, `cost.transit (${r.label})`),
  }));
}

export function loadEmissions(): EmissionsRow[] {
  return parseCsvRecords(read('emissions.csv')).map((r) => ({
    route: num(r.route, 'emissions.route'),
    label: r.label,
    miles: num(r.miles, `emissions.miles (${r.label})`),
    gas: num(r.gas_lbs, `emissions.gas_lbs (${r.label})`),
    ev: num(r.ev_lbs, `emissions.ev_lbs (${r.label})`),
    transit: num(r.transit_lbs, `emissions.transit_lbs (${r.label})`),
  }));
}

export function loadBarriers(): Barrier[] {
  return parseCsvRecords(read('survey-barriers.csv'))
    .map((r) => ({ barrier: r.barrier.toLowerCase(), responses: num(r.responses, 'barriers') }))
    .sort((a, b) => b.responses - a.responses);
}

export function loadAssumptions(): Assumption[] {
  return parseCsvRecords(read('assumptions.csv')).map((r) => ({
    parameter: r.parameter,
    value: num(r.value, `assumptions.value (${r.parameter})`),
    source: r.unit_source,
  }));
}

/** Looks up a single assumption by name, throwing if the study never recorded it. */
export function assumption(name: string): Assumption {
  const found = loadAssumptions().find((a) => a.parameter === name);
  if (!found) throw new Error(`No assumption named ${JSON.stringify(name)} in assumptions.csv`);
  return found;
}

export function totalRespondents(): number {
  return loadBarriers().reduce((n, b) => n + b.responses, 0);
}

/**
 * Route 1's trip decomposed into walking and riding.
 *
 * This is the study's most striking finding and the site's lead visual: a 46-minute
 * transit trip that is 42 minutes of walking around a 4-minute bus ride. The numbers
 * are parsed out of the route's own transit description rather than retyped, so the
 * chart cannot drift from the source data.
 */
export type TripBreakdown = { walkTo: number; bus: number; walkFrom: number; total: number };

export function route1Breakdown(): TripBreakdown {
  const r = loadRoutes().find((x) => x.route === 1);
  if (!r) throw new Error('routes.csv has no route 1');

  const total = Number(r.transit.match(/^(\d+)\s*min/)?.[1]);
  const walks = [...r.transit.matchAll(/(\d+)\s*min walk/g)].map((m) => Number(m[1]));
  const bus = Number(r.transit.match(/(\d+)\s*min bus/)?.[1]);

  if (!Number.isFinite(total) || !Number.isFinite(bus) || walks.length !== 2) {
    throw new Error(
      `Could not decompose route 1's transit trip from ${JSON.stringify(r.transit)}. ` +
        'Expected a total, two "N min walk" segments and one "N min bus" segment.',
    );
  }
  return { walkTo: walks[0], bus, walkFrom: walks[1], total };
}
