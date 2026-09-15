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
