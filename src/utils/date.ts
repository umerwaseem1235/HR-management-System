/** YYYY-MM-DD for a Date (local time, no UTC shift). */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Today's date as YYYY-MM-DD. */
export function todayStr(): string {
  return toDateStr(new Date());
}

/** IANA zone every wall-clock stamp in this app is recorded in.
 *  Server actions run on UTC clocks — stamping `new Date()` there once put
 *  check-ins 5 hours behind. Always go through companyTimeStr/companyDateStr
 *  on the server side. */
export const COMPANY_TIME_ZONE = 'Asia/Karachi';

/** "HH:MM" wall-clock time in the company zone. */
export function companyTimeStr(at: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: COMPANY_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(at);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '00';
  // en-GB hour12:false yields "24" at midnight in some ICU builds.
  const hour = get('hour') === '24' ? '00' : get('hour');
  return `${hour}:${get('minute')}`;
}

/** "YYYY-MM-DD" in the company zone — the server-side "today". */
export function companyDateStr(at: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: COMPANY_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
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

/** Decimal work hours -> "6h 30m" (6.5 -> "6h 30m", 8 -> "8h"). 0/invalid -> "0h". */
export function formatWorkHours(hours: number | null | undefined): string {
  const total = Math.round((Number(hours) || 0) * 60);
  return total <= 0 ? '0h' : minutesToHrs(total);
}

/** Inclusive day count between two YYYY-MM-DD dates. */
export function daysBetweenInclusive(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.round(ms / 86400000) + 1;
}

/**
 * Null-safe inclusive day count. Returns null when either date is missing,
 * invalid, or the range is reversed. Canonical home of the duplicated
 * `diffInDaysInclusive` helpers in leave/utils + remote/useRemoteView.
 */
export function diffInDaysInclusive(start: string, end: string): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return null;
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

/** Short month labels shared by progress/reports date formatters. */
export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec',
] as const;

/** "2026-09-28" -> "28-Sept-2026". Canonical home of formatSubmission/dash. */
export function formatDayMonYear(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return dateStr;
  return `${String(d).padStart(2, '0')}-${MONTHS_SHORT[m - 1]}-${y}`;
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
