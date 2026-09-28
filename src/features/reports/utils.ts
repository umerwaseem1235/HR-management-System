// Canonical helpers live in @/utils — re-exported here so existing
// `from '@/features/reports'` imports keep working.
export { stripHtml } from '@/utils/text';
export { MONTHS_SHORT as MONTHS, formatDayMonYear as dash } from '@/utils/date';
export { PAGE_SIZE_OPTIONS as PAGE_SIZES } from '@/utils/pagination';
export { toDateStr as toISO } from '@/utils/date';

/** Today's date label for exported filenames (UTC slice — preserves existing behavior). */
export function todayLabel(): string {
  return new Date().toISOString().slice(0, 10);
}

export function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 13);
  const iso = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { from: iso(from), to: iso(to) };
}

/** 2026-09-28 -> 28/09/2026 — screen tables */
export function slash(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

export const PRINT_STATUS_COLOR: Record<string, string> = {
  Present: '#15803d',
  Late: '#dc2626',
  'Half Day': '#d97706',
  Leave: '#024fa7',
  Absent: '#dc2626',
  Holiday: '#7c3aed',
  Weekend: '#64748b',
};
