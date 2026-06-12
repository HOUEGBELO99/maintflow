/**
 * Reference "now" for the seeded demo scenario, matching the prototype's
 * `NOW = new Date("2026-05-21T09:30:00")`. The seeded dataset is a fixed
 * snapshot, so relative computations (J-N reminders, due-in days) are anchored
 * here rather than the wall clock. Swap for `new Date()` once real data flows.
 */
export const SCENARIO_TODAY = '2026-05-21';
export const SCENARIO_NOW = new Date('2026-05-21T09:30:00.000Z');

const MS_PER_DAY = 86_400_000;

const atUtcMidnight = (isoDate: string): number => new Date(`${isoDate}T00:00:00.000Z`).getTime();

/** ISO date (YYYY-MM-DD) of a Date in UTC. */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Add `weeks` weeks to an ISO date, returning an ISO date. */
export function addWeeksISO(isoDate: string, weeks: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + weeks * 7);
  return toISODate(d);
}

/** Subtract `days` days from an ISO date, returning an ISO date. */
export function minusDaysISO(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return toISODate(d);
}

/** Whole days from the reference date until `isoDate` (negative = past). */
export function daysUntil(isoDate: string, today: string = SCENARIO_TODAY): number {
  return Math.round((atUtcMidnight(isoDate) - atUtcMidnight(today)) / MS_PER_DAY);
}
