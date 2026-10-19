/**
 * Date helpers for day-granularity business dates (due dates, reminders).
 * Business dates are stored at UTC midnight; "today" is the wall clock in UTC.
 */
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

/** Today's date (YYYY-MM-DD, UTC). */
export function todayISO(): string {
  return toISODate(new Date());
}

/** Whole days from `today` until `isoDate` (negative = past). */
export function daysUntil(isoDate: string, today: string = todayISO()): number {
  return Math.round((atUtcMidnight(isoDate) - atUtcMidnight(today)) / MS_PER_DAY);
}
