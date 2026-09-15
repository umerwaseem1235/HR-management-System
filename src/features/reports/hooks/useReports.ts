'use client';

import { useMemo, useState } from 'react';
import { mockEmployees } from '@/lib/mock-data';
import { downloadTabReport } from '@/lib/reports-pdf';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { useWork } from '@/contexts/WorkContext';
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

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function fmtTime(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

function fmtDur(mins: number): string {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
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

export const PRINT_STATUS_COLOR: Record<string, string> = {
  Present: '#15803d',
  Late: '#dc2626',
  'Half Day': '#d97706',
  Leave: '#024fa7',
  Absent: '#dc2626',
  Holiday: '#7c3aed',
};

export const PAGE_SIZES = [5, 10, 20];

/* ================= Hook ================= */

export function useReports() {
  const { user } = useAuth();
  const { entries: progressEntries } = useProgress();
  const { workItems } = useWork();

  const [tab, setTab] = useState<TabId>('attendance');
  const init = useMemo(() => defaultRange(), []);
  const [draftFrom, setDraftFrom] = useState(init.from);
  const [draftTo, setDraftTo] = useState(init.to);
  const [from, setFrom] = useState(init.from);
  const [to, setTo] = useState(init.to);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [empId, setEmpId] = useState(mockEmployees[0]?.id ?? '');
  const [viewDay, setViewDay] = useState<AttendanceDayRow | null>(null);
  const [viewNote, setViewNote] = useState<{ project: string; date: string; html: string } | null>(null);
  const [viewTask, setViewTask] = useState<DailyWork | null>(null);

  const [downloading, setDownloading] = useState(false);

  const employee = useMemo(() => {
    if (!user) return undefined;
    return (
      mockEmployees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
      mockEmployees.find((e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase())
    );
  }, [user]);

  const isEmployee = user?.role === 'employee';
  const scopeId = isEmployee ? (employee?.id ?? user?.id ?? '') : empId;
  const scopeEmployee = mockEmployees.find((e) => e.id === scopeId);
  const scopeName = scopeEmployee ? `${scopeEmployee.firstName} ${scopeEmployee.lastName}` : (isEmployee ? (user?.name ?? '') : '');

  const switchTab = (t: TabId) => {
    setTab(t);
    setPage(1);
  };

  const handleFetch = () => {
    setFrom(draftFrom);
    setTo(draftTo);
    setPage(1);
  };

  /* ---- Attendance rows ---- */
  const attendanceRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return buildAttendanceDays(scopeId, from, to).filter((r) => {
      if (q && !`${r.date} ${r.weekday} ${r.status} ${r.clockIn} ${r.clockOut}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [scopeId, from, to, query]);

  /* ---- Progress rows (real entries) ---- */
  const progressRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return progressEntries
      .filter((e) => {
        if (e.employeeId !== scopeId && e.employeeName.toLowerCase() !== scopeName.toLowerCase()) return false;
        if (from && e.submissionDate < from) return false;
        if (to && e.submissionDate > to) return false;
        if (q && !`${e.projectName} ${stripHtml(e.description)} ${e.submissionDate}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .sort((a, b) => (a.submissionDate < b.submissionDate ? -1 : a.submissionDate > b.submissionDate ? 1 : 0));
  }, [progressEntries, scopeId, scopeName, from, to, query]);

  /* ---- Task rows (daily work) ---- */
  const taskRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return workItems
      .filter((w) => {
        if (w.employeeId !== scopeId && w.employeeName.toLowerCase() !== scopeName.toLowerCase()) return false;
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
    setTimeout(() => {
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
    user, isEmployee, employee, scopeId, scopeName,
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
