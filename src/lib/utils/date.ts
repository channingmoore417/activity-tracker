import { format } from "date-fns";

export function formatDisplayDate(date: Date | string) {
  return format(new Date(date), "MMM d, yyyy");
}

/* ── Fixed US federal holidays (MM-DD) ── */
const FIXED_HOLIDAYS = ["01-01", "06-19", "07-04", "11-11", "12-25"];

/**
 * Returns the date of the nth occurrence of a weekday in a given month.
 * @param weekday 0 = Sunday, 1 = Monday, … 6 = Saturday
 * @param n 1-indexed (1st, 2nd, 3rd, …)
 */
function nthWeekday(year: number, month: number, weekday: number, n: number): Date {
  const first = new Date(year, month, 1);
  const firstDow = first.getDay();
  const diff = (weekday - firstDow + 7) % 7;
  return new Date(year, month, 1 + diff + (n - 1) * 7);
}

/** Returns the date of the last occurrence of a weekday in a given month. */
function lastWeekday(year: number, month: number, weekday: number): Date {
  const last = new Date(year, month + 1, 0); // last day of month
  const lastDow = last.getDay();
  const diff = (lastDow - weekday + 7) % 7;
  return new Date(year, month, last.getDate() - diff);
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function toMMDD(d: Date): string {
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Compute all floating federal holidays for a given year (as MM-DD strings). */
function floatingHolidays(year: number): string[] {
  return [
    toMMDD(nthWeekday(year, 0, 1, 3)),   // MLK Day — 3rd Monday in January
    toMMDD(nthWeekday(year, 1, 1, 3)),   // Presidents Day — 3rd Monday in February
    toMMDD(lastWeekday(year, 4, 1)),     // Memorial Day — last Monday in May
    toMMDD(nthWeekday(year, 8, 1, 1)),   // Labor Day — 1st Monday in September
    toMMDD(nthWeekday(year, 9, 1, 2)),   // Columbus Day — 2nd Monday in October
    toMMDD(nthWeekday(year, 10, 4, 4)),  // Thanksgiving — 4th Thursday in November
  ];
}

/**
 * Returns true if the given date is a weekend (Sat/Sun) or a US federal holiday.
 * On free days, missing the 100-pt target does NOT break a streak.
 */
export function isFreeDay(date: Date): boolean {
  const dow = date.getDay(); // 0 = Sun, 6 = Sat
  if (dow === 0 || dow === 6) return true;

  const mmdd = toMMDD(date);
  if (FIXED_HOLIDAYS.includes(mmdd)) return true;

  const year = date.getFullYear();
  if (floatingHolidays(year).includes(mmdd)) return true;

  return false;
}
