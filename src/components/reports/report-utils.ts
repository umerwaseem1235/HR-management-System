export { STATUS_COLORS } from '../../lib/constants';

export type TabId = 'attendance' | 'progress' | 'task';

export const PAGE_SIZES = [5, 10, 20];

export const PRINT_STATUS_COLOR: Record<string, string> = {
  Present: '#15803d',
  Late: '#dc2626',
  'Half Day': '#d97706',
  Leave: '#024fa7',
  Absent: '#dc2626',
  Holiday: '#7c3aed',
};

export const WORK_STATUS_BADGE: Record<string, 'info' | 'success' | 'warning'> = {
  Submitted: 'info',
  Approved: 'success',
  'Needs Revision': 'warning',
};

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 13);
  return { from: toISO(from), to: toISO(to) };
}

/** 01/09/2026 — screen tables */
export function slash(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

/** 01-Sept-2026 — progress dates */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
export function dash(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  return `${String(d).padStart(2, '0')}-${MONTHS[m - 1]}-${y}`;
}

export function stripHtml(html: string): string {
  return html
    .replace(/<(br|p|div|li|h1|h2|h3)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function fmtTime(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

export function fmtDur(mins: number): string {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export interface AttendanceDayRow {
  date: string;
  weekday: string;
  clockIn: string;
  clockOut: string;
  hours: string;
  status: 'Present' | 'Late' | 'Half Day' | 'Leave' | 'Absent' | 'Holiday';
}

/** Deterministic per-employee daily attendance for any date range. */
export function buildAttendanceDays(empId: string, from: string, to: string): AttendanceDayRow[] {
  const rows: AttendanceDayRow[] = [];
  if (!from || !to || from > to) return rows;
  const end = new Date(`${to}T00:00:00`);
  for (let d = new Date(`${from}T00:00:00`); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = toISO(d);
    const weekday = d.toLocaleDateString('en-US', { weekday: 'long' });
    if (d.getDay() === 0) {
      rows.push({ date: iso, weekday, clockIn: '—', clockOut: '—', hours: '—', status: 'Holiday' });
      continue;
    }
    const h = hashStr(`${empId}|${iso}`);
    const r = h % 100;
    let status: AttendanceDayRow['status'] = 'Present';
    if (r >= 94) status = 'Absent';
    else if (r >= 89) status = 'Leave';
    else if (r >= 84) status = 'Half Day';
    else if (r >= 73) status = 'Late';
    if (status === 'Absent' || status === 'Leave') {
      rows.push({ date: iso, weekday, clockIn: '—', clockOut: '—', hours: '—', status });
      continue;
    }
    if (status === 'Half Day') {
      const inM = 8 * 60 + 40 + ((h >> 3) % 20);
      const outM = 13 * 60 + 30 + ((h >> 5) % 80);
      rows.push({ date: iso, weekday, clockIn: fmtTime(inM), clockOut: fmtTime(outM), hours: fmtDur(outM - inM), status });
      continue;
    }
    const inM = 8 * 60 + 35 + ((h >> 2) % 55);
    const outM = 17 * 60 + 55 + ((h >> 4) % 55);
    rows.push({ date: iso, weekday, clockIn: fmtTime(inM), clockOut: fmtTime(outM), hours: fmtDur(outM - inM), status });
  }
  return rows;
}
