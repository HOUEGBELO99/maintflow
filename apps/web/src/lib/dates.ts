/**
 * Day-granularity date helpers. Business dates (scheduledFor, nextDue) are
 * plain `YYYY-MM-DD` days, compared at UTC midnight so a timezone offset never
 * moves an event to the previous/next day.
 */

const MS_PER_DAY = 86_400_000;

/** `YYYY-MM-DD` of a Date, read in UTC (for dates built at UTC midnight). */
export const toISO = (d: Date): string => d.toISOString().slice(0, 10);

/** Today's calendar day for the user (local timezone), as `YYYY-MM-DD`. */
export function todayISO(): string {
  const now = new Date();
  const local = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  return toISO(local);
}

/** UTC-midnight Date for an ISO day (accepts a full ISO datetime too). */
export const dayAt = (iso: string): Date => new Date(`${iso.slice(0, 10)}T00:00:00Z`);

/** `iso` shifted by `days` days. */
export function addDaysISO(iso: string, days: number): string {
  const d = dayAt(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

/** Whole days from today until `iso` (negative = in the past). */
export const daysUntil = (iso: string, today: string = todayISO()): number =>
  Math.round((dayAt(iso).getTime() - dayAt(today).getTime()) / MS_PER_DAY);

/**
 * The 35 days (5 weeks, Monday-first) shown by a month-style calendar: starts
 * on the Monday of the week before `anchor`, shifted by `weekOffset` weeks.
 */
export function calendarCells(anchor: string, weekOffset = 0): Date[] {
  const a = dayAt(anchor);
  const monOffset = (a.getUTCDay() + 6) % 7;
  const start = new Date(a);
  start.setUTCDate(a.getUTCDate() - monOffset - 7 + weekOffset * 7);
  return Array.from({ length: 35 }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return d;
  });
}

/** "octobre 2026" style label for the month mostly covered by `cells`. */
export function calendarTitle(cells: Date[]): string {
  const mid = cells[17] ?? cells[0] ?? new Date();
  return mid.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
