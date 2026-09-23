/** YYYY-MM-DD for a Date (local time, no UTC shift). */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Today's date as YYYY-MM-DD. */
export function todayStr(): string {
  return toDateStr(new Date());
}

/** "09:30" -> 570. Returns 0 for empty/invalid input. */
export function timeToMinutes(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

/** 90 -> "1h 30m", 60 -> "1h". */
export function minutesToHrs(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Inclusive day count between two YYYY-MM-DD dates. */
export function daysBetweenInclusive(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / 86400000) + 1;
}

/** Office off (day-end) time used by the early-checkout rule. */
export const OFFICE_END_TIME = '18:00';

/** Checking out this many minutes (or more) before off time = Half Day (half leave). */
export const EARLY_CHECKOUT_HALF_DAY_MINUTES = 15;

/** Minutes the checkout is before off time (>0 means left early). */
export function minutesEarly(checkOut: string, standardEnd: string = OFFICE_END_TIME): number {
  if (!checkOut) return 0;
  return Math.max(0, timeToMinutes(standardEnd) - timeToMinutes(checkOut));
}

/** True when the checkout is early enough to count as half leave. */
export function isEarlyHalfDayCheckout(
  checkOut: string,
  standardEnd: string = OFFICE_END_TIME,
  thresholdMinutes: number = EARLY_CHECKOUT_HALF_DAY_MINUTES,
): boolean {
  return minutesEarly(checkOut, standardEnd) >= thresholdMinutes;
}
