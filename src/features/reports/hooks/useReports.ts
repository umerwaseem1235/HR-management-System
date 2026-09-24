'use client';

import { useEffect, useMemo, useState } from 'react';
// NOTE: jspdf is loaded lazily inside handleDownloadPDF so the reports page
// renders without the PDF library in its initial bundle.
import { downloadTabReport } from '@/lib/reports-pdf';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { useWork } from '@/contexts/WorkContext';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { getAttendanceReport, getReportEmployees, type ReportEmployeeOption } from '@/lib/actions/reports';
import { createResourceCache } from '@/lib/resource-cache';
import type { AttendanceRecord } from '@/lib/types';
import type { DailyWork } from '@/types';
import type { AttendanceDayRow, TabId } from '../types';

/* ================= Helpers ================= */

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

function fmtDur(mins: number): string {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

/** Map a real attendance record to a report day row. */
function recordToDayRow(r: AttendanceRecord): AttendanceDayRow {
  const weekday = new Date(`${r.date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long' });
  const mins = Math.round((Number(r.workHours) || 0) * 60);
  return {
    date: r.date,
    weekday,
    clockIn: r.checkIn || '—',
    clockOut: r.checkOut || '—',
    hours: mins > 0 ? fmtDur(mins) : '—',
    status: (r.status || 'Present') as AttendanceDayRow['status'],
  };
}

function toMinutes(t: string | null | undefined): number | null {
  if (!t) return null;
  const m = t.match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function formatHours(checkIn: string | null | undefined, checkOut: string | null | undefined, workHours: number | null | undefined): string {
  const inM = toMinutes(checkIn);
  const outM = toMinutes(checkOut);
  if (inM !== null && outM !== null && outM > inM) {
    const diff = outM - inM;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  }
  if (workHours && workHours > 0) {
    const h = Math.floor(workHours);
    const mins = Math.round((workHours - h) * 60);
    return mins > 0 ? `${h}h ${mins}m` : `${h}h`;
  }
  return '—';
}

/** Map a real DB attendance record to a report table row. */
function toDayRow(r: AttendanceRecord): AttendanceDayRow {
  const d = new Date(`${r.date}T00:00:00`);
  const weekday = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'long' });
  return {
    date: r.date,
    weekday,
    clockIn: r.checkIn || '—',
    clockOut: r.checkOut || '—',
    hours: formatHours(r.checkIn, r.checkOut, r.workHours),
    status: (r.status as AttendanceDayRow['status']) ?? 'Present',
  };
}

/**
 * @deprecated Reports now load real attendance from the database
 * (`getAttendanceReport`). Kept only so old imports don't break.
 */
export function buildAttendanceDays(_empId: string, _from: string, _to: string): AttendanceDayRow[] {
  return [];
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

export const PAGE_SIZES = [5, 10, 20];

// Module scope survives navigation, so returning to /reports reuses the
// employee options and any already-fetched month slices / report rows.
const reportEmployeesCache = createResourceCache<ReportEmployeeOption[]>('reports:employees', 5 * 60_000);

function scopedReportCache(scopeId: string, from: string, to: string) {
  return createResourceCache<AttendanceRecord[]>(`reports:detail:${scopeId}:${from}:${to}`, 60_000);
}

/* ================= Hook ================= */

export function useReports() {
  const { user } = useAuth();
  const { entries: progressEntries } = useProgress();
  const { workItems } = useWork();
  const { employees, findByUser } = useEmployeeDirectory();

  const [tab, setTab] = useState<TabId>('attendance');
  const init = useMemo(() => defaultRange(), []);
  const [draftFrom, setDraftFrom] = useState(init.from);
  const [draftTo, setDraftTo] = useState(init.to);
  const [from, setFrom] = useState(init.from);
  const [to, setTo] = useState(init.to);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Real employees from the database (no dummy data).
  const [reportEmployees, setReportEmployees] = useState<ReportEmployeeOption[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [empId, setEmpId] = useState('');
  const [viewDay, setViewDay] = useState<AttendanceDayRow | null>(null);
  const [viewNote, setViewNote] = useState<{ project: string; date: string; html: string } | null>(null);
  const [viewTask, setViewTask] = useState<DailyWork | null>(null);

  // Real attendance rows from the database for the selected range.
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const [downloading, setDownloading] = useState(false);

  const employee = useMemo(() => findByUser(user), [findByUser, user]);

  useEffect(() => {
    let cancelled = false;
    async function loadEmployees() {
      const snapshot = reportEmployeesCache.peek();
      if (snapshot) {
        if (!cancelled) {
          setReportEmployees(snapshot.data);
          setEmpId((prev) => prev || snapshot.data[0]?.id || '');
          setEmployeesLoading(false);
        }
        if (!snapshot.isStale) return;
      }
      try {
        const list = await reportEmployeesCache.load(getReportEmployees, { force: true });
        if (cancelled) return;
        setReportEmployees(list);
        // Default the dropdown to the first real employee.
        setEmpId((prev) => prev || list[0]?.id || '');
      } catch (err) {
        console.error('Failed to load report employees:', err);
      } finally {
        if (!cancelled) setEmployeesLoading(false);
      }
    }
    loadEmployees();
    return () => {
      cancelled = true;
    };
  }, []);

  const isEmployee = user?.role === 'employee';
  // Employees always see their own real record (directory lookup with auth
  // fallback); admins/HR see the selected real employee.
  const scopeId = isEmployee ? (employee?.id ?? user?.employeeId ?? '') : empId;
  const scopeEmployee = reportEmployees.find((e) => e.id === scopeId) ?? employees.find((e) => e.id === scopeId);
  const scopeName = scopeEmployee
    ? `${scopeEmployee.firstName} ${scopeEmployee.lastName}`.trim()
    : (isEmployee ? (user?.name ?? '') : '');

  // Default the admin scope picker to the first live employee
  useEffect(() => {
    if (!isEmployee && !empId && employees.length > 0) {
      setEmpId(employees[0].id);
    }
  }, [isEmployee, empId, employees]);

  // NOTE: a previous version bulk-loaded getAllAttendance() for EVERY month
  // in the range (all employees) AND then loaded the scoped employee report
  // on top — doubling the slowest query on every visit. The scoped loader
  // below is the only one needed: it fetches exactly the selected employee
  // + range, cached per scope so switching modules and coming back is instant.

  const switchTab = (t: TabId) => {
    setTab(t);
    setPage(1);
  };

  const handleFetch = () => {
    setFrom(draftFrom);
    setTo(draftTo);
    setPage(1);
  };

  /* ---- Attendance rows (REAL database records, real records only — no synthetic data) ---- */
  useEffect(() => {
    let cancelled = false;
    async function loadAttendance() {
      if (!scopeId || !from || !to || from > to) {
        return;
      }
      const cache = scopedReportCache(scopeId, from, to);
      // Paint the cached scope instantly; only show the spinner on a cold miss
      // so returning from another module never flashes a loader.
      const snapshot = cache.peek();
      if (snapshot) {
        if (!cancelled) {
          setAttendanceRecords(snapshot.data);
          setAttendanceLoading(false);
        }
        if (!snapshot.isStale) return;
      } else if (!cancelled) {
        setAttendanceLoading(true);
      }
      try {
        const rows = await cache.load(() => getAttendanceReport(scopeId, from, to), { force: !snapshot });
        if (!cancelled) setAttendanceRecords(rows);
      } catch (err) {
        console.error('Failed to load attendance report:', err);
      } finally {
        if (!cancelled) setAttendanceLoading(false);
      }
    }
    loadAttendance();
    return () => {
      cancelled = true;
    };
  }, [scopeId, from, to]);

  const attendanceRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return attendanceRecords
      .filter((r) => {
        if (scopeId && r.employeeId !== scopeId && r.employeeName.toLowerCase() !== scopeName.toLowerCase()) return false;
        if (from && r.date < from) return false;
        if (to && r.date > to) return false;
        return true;
      })
      .map(toDayRow)
      .filter((r) => {
        if (q && !`${r.date} ${r.weekday} ${r.status} ${r.clockIn} ${r.clockOut}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }, [attendanceRecords, scopeId, scopeName, from, to, query]);

  /* ---- Progress rows (real entries from ProgressContext / DB) ---- */
  const progressRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const scope = scopeName.trim().toLowerCase();
    return progressEntries
      .filter((e) => {
        if (scopeId || scope) {
          const idMatch = scopeId ? e.employeeId === scopeId : false;
          const nameMatch = scope ? e.employeeName.toLowerCase() === scope : false;
          if (!idMatch && !nameMatch) return false;
        }
        if (from && e.submissionDate < from) return false;
        if (to && e.submissionDate > to) return false;
        if (q && !`${e.employeeName} ${e.projectName} ${stripHtml(e.description)} ${e.submissionDate}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (a.submissionDate < b.submissionDate ? -1 : a.submissionDate > b.submissionDate ? 1 : 0));
  }, [progressEntries, scopeId, scopeName, from, to, query]);

  /* ---- Task rows (daily work, real DB) ---- */
  const taskRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const scope = scopeName.trim().toLowerCase();
    return workItems
      .filter((w) => {
        if (scopeId || scope) {
          const idMatch = scopeId ? w.employeeId === scopeId : false;
          const nameMatch = scope ? w.employeeName.toLowerCase() === scope : false;
          if (!idMatch && !nameMatch) return false;
        }
        if (from && w.date < from) return false;
        if (to && w.date > to) return false;
        if (q && !`${w.title} ${w.description} ${w.date} ${w.status}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }, [workItems, scopeId, scopeName, from, to, query]);

  const rowCount = tab === 'attendance' ? attendanceRows.length : tab === 'progress' ? progressRows.length : taskRows.length;
  const totalPages = Math.max(1, Math.ceil(rowCount / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = rowCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, rowCount);
  const attPage = attendanceRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const progPage = progressRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const taskPage = taskRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const tabMeta: Record<TabId, { title: string; fetchLabel: string }> = {
    attendance: { title: 'Attendance & Leave Report', fetchLabel: 'Fetch Report' },
    progress: { title: 'Progress Report', fetchLabel: 'Search' },
    task: { title: 'Task Report', fetchLabel: 'Fetch Report' },
  };

  const todayLabel = () => new Date().toISOString().slice(0, 10);

  const handleDownloadPDF = () => {
    if (downloading) return;
    setDownloading(true);
    setTimeout(async () => {
      // Load jspdf on demand: keeps the reports bundle lean until export.
      const { downloadTabReport } = await import('@/lib/reports-pdf');
      try {
        const range = `${slash(from)} – ${slash(to)}`;
        if (tab === 'attendance') {
          const present = attendanceRows.filter((r) => r.status === 'Present').length;
          const late = attendanceRows.filter((r) => r.status === 'Late').length;
          const absent = attendanceRows.filter((r) => r.status === 'Absent').length;
          downloadTabReport({
            fileSlug: 'attendance-report',
            eyebrow: `Attendance · ${todayLabel()}`,
            title: 'Attendance & Leave Report',
            subtitle: 'Daily records with clock times and working hours',
            meta: `${range} · ${scopeName} · ${attendanceRows.length} records`,
            kpis: [
              { label: 'Records', value: String(attendanceRows.length) },
              { label: 'Present', value: String(present) },
              { label: 'Late', value: String(late) },
              { label: 'Absent', value: String(absent) },
            ],
            sectionTitle: 'RECORDS — FULL DETAIL',
            cols: [
              { label: '#', width: 12, align: 'center' },
              { label: 'Date & Day', width: 44, align: 'left' },
              { label: 'Clock In', width: 24, align: 'center' },
              { label: 'Clock Out', width: 24, align: 'center' },
              { label: 'Hours', width: 26, align: 'center' },
              { label: 'Status', width: 52, align: 'center' },
            ],
            rows: attendanceRows.map((r, i) => [
              String(i + 1),
              `${slash(r.date)} · ${r.weekday.slice(0, 3)}`,
              r.clockIn,
              r.clockOut,
              r.hours,
              r.status,
            ]),
          });
        } else if (tab === 'progress') {
          const projects = new Set(progressRows.map((e) => e.projectName)).size;
          downloadTabReport({
            fileSlug: 'progress-report',
            eyebrow: `Progress · ${todayLabel()}`,
            title: 'Progress Report',
            subtitle: 'Daily progress updates with project and notes',
            meta: `${range} · ${scopeName} · ${progressRows.length} entries`,
            kpis: [
              { label: 'Entries', value: String(progressRows.length) },
              { label: 'Projects', value: String(projects) },
              { label: 'From', value: slash(from) },
              { label: 'To', value: slash(to) },
            ],
            sectionTitle: 'ENTRIES — FULL DETAIL',
            cols: [
              { label: 'Date', width: 28, align: 'center' },
              { label: 'Employee', width: 38, align: 'left' },
              { label: 'Project', width: 42, align: 'left' },
              { label: 'Note', width: 74, align: 'left' },
            ],
            rows: progressRows.map((e) => [
              dash(e.submissionDate),
              e.employeeName,
              e.projectName,
              stripHtml(e.description) || '-',
            ]),
          });
        } else {
          const approved = taskRows.filter((w) => w.status === 'Approved').length;
          const pending = taskRows.filter((w) => w.status !== 'Approved').length;
          downloadTabReport({
            fileSlug: 'task-report',
            eyebrow: `Tasks · ${todayLabel()}`,
            title: 'Task Report',
            subtitle: 'Daily work items with status and ownership',
            meta: `${range} · ${scopeName} · ${taskRows.length} tasks`,
            kpis: [
              { label: 'Tasks', value: String(taskRows.length) },
              { label: 'Approved', value: String(approved) },
              { label: 'Pending', value: String(pending) },
              { label: 'To', value: slash(to) },
            ],
            sectionTitle: 'TASKS — FULL DETAIL',
            cols: [
              { label: 'Date', width: 28, align: 'center' },
              { label: 'Title', width: 52, align: 'left' },
              { label: 'Employee', width: 40, align: 'left' },
              { label: 'Status', width: 30, align: 'center' },
              { label: 'Description', width: 32, align: 'left' },
            ],
            rows: taskRows.map((w) => [
              slash(w.date),
              w.title,
              w.employeeName,
              w.status,
              w.description || '-',
            ]),
          });
        }
      } finally {
        setDownloading(false);
      }
    }, 60);
  };

  return {
    user, isEmployee, employee, scopeEmployee, employees, reportEmployees, employeesLoading, attendanceLoading, scopeId, scopeName,
    tab, switchTab, tabMeta,
    draftFrom, setDraftFrom, draftTo, setDraftTo,
    from, to, query, setQuery, page, setPage, pageSize, setPageSize,
    empId, setEmpId,
    viewDay, setViewDay, viewNote, setViewNote, viewTask, setViewTask,
    downloading, handleFetch, handleDownloadPDF,
    attendanceRows, progressRows, taskRows,
    rowCount, totalPages, safePage, start, end, attPage, progPage, taskPage,
  };
}

export type UseReportsReturn = ReturnType<typeof useReports>;
