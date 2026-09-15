'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import SearchBar from '../../components/ui/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import {
  Download, Clock, DollarSign, TrendingUp, Receipt, FileDown,
  Search, Printer, Eye, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';
import { STATUS_COLORS } from '../../lib/constants';
import { downloadReport, downloadAllReportsPack, type ReportId } from '../../lib/reports-pdf';
import { useAuth } from '../../contexts/AuthContext';
import { useProgress } from '../../contexts/ProgressContext';
import { useWork } from '../../contexts/WorkContext';
import type { DailyWork } from '../../lib/types';

/* ================= Helpers ================= */

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function defaultRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 13);
  return { from: toISO(from), to: toISO(to) };
}

/** 01/09/2026 — screen tables */
function slash(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

/** 01-Sept-2026 — progress dates */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
function dash(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  return `${String(d).padStart(2, '0')}-${MONTHS[m - 1]}-${y}`;
}

function stripHtml(html: string): string {
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

export interface AttendanceDayRow {
  date: string;
  weekday: string;
  clockIn: string;
  clockOut: string;
  hours: string;
  status: 'Present' | 'Late' | 'Half Day' | 'Leave' | 'Absent' | 'Holiday';
}

/** Deterministic per-employee daily attendance for any date range. */
function buildAttendanceDays(empId: string, from: string, to: string): AttendanceDayRow[] {
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

const PRINT_STATUS_COLOR: Record<string, string> = {
  Present: '#15803d',
  Late: '#dc2626',
  'Half Day': '#d97706',
  Leave: '#024fa7',
  Absent: '#dc2626',
  Holiday: '#7c3aed',
};

const WORK_STATUS_BADGE: Record<string, 'info' | 'success' | 'warning'> = {
  Submitted: 'info',
  Approved: 'success',
  'Needs Revision': 'warning',
};

const PAGE_SIZES = [5, 10, 20];
type TabId = 'attendance' | 'progress' | 'task';

/* ================= Existing PDF export library ================= */

const reports: { id: ReportId; name: string; description: string; icon: typeof Clock; category: string; records: string }[] = [
  { id: 'attendance', name: 'Attendance Report', description: 'Daily, weekly, and monthly attendance summary', icon: Clock, category: 'Attendance', records: 'Daily records · hours + status' },
  { id: 'progress', name: 'Progress Report', description: 'Daily progress updates with notes in full', icon: TrendingUp, category: 'Progress', records: 'All entries · project + note' },
  { id: 'payroll-summary', name: 'Payroll Summary', description: 'Monthly payroll summary by department', icon: DollarSign, category: 'Payroll', records: 'All payslips · gross + net' },
  { id: 'expense-claims', name: 'Expense Claims Report', description: 'Expense claims by category and status', icon: Receipt, category: 'Finance', records: 'All claims · amounts + status' },
];

/* ================= Page ================= */

export default function ReportsPage() {
  const { user } = useAuth();
  const { entries: progressEntries } = useProgress();
  const { workItems } = useWork();

  const [tab, setTab] = useState<TabId>('attendance');
  const init = useMemo(defaultRange, []);
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

  const [search, setSearch] = useState('');
  const [downloading, setDownloading] = useState<ReportId | 'all' | null>(null);

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

  if (!user) return null;

  const statusPill = (status: string) => (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );

  const tabMeta: Record<TabId, { title: string; fetchLabel: string }> = {
    attendance: { title: 'Attendance & Leave Report', fetchLabel: 'Fetch Report' },
    progress: { title: 'Progress Report', fetchLabel: 'Search' },
    task: { title: 'Task Report', fetchLabel: 'Fetch Report' },
  };

  const filtered = reports.filter((r) =>
    !search.trim() || `${r.name} ${r.description} ${r.category}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  const handleExport = (id: ReportId) => {
    if (downloading) return;
    setDownloading(id);
    setTimeout(() => {
      try {
        downloadReport(id);
      } finally {
        setDownloading(null);
      }
    }, 60);
  };

  const handleExportAll = () => {
    if (downloading) return;
    setDownloading('all');
    setTimeout(() => {
      try {
        downloadAllReportsPack();
      } finally {
        setDownloading(null);
      }
    }, 60);
  };

  const actionBtn =
    'p-1.5 rounded-lg bg-[#EAF2F4] text-[#0F8B8D] hover:bg-[#D6E4E8] cursor-pointer';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Reports"
          actions={
            <Button variant="primary" size="md" onClick={handleExportAll} loading={downloading === 'all'} disabled={downloading !== null}>
              {!downloading && <FileDown size={16} />}
              {downloading === 'all' ? 'Building pack…' : 'Download all (PDF pack)'}
            </Button>
          }
        />

        {/* Tab switcher */}
        <div className="inline-flex rounded-xl bg-[#EAF2F4] p-1">
          {(['attendance', 'progress', 'task'] as TabId[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              className={`rounded-lg px-6 py-2 text-sm capitalize transition-all cursor-pointer ${
                tab === t ? 'bg-white font-semibold text-[#17324D] shadow-sm' : 'font-medium text-gray-500 hover:text-[#17324D]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Filters */}
        <Card padding="sm">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-1">
                  <SearchBar
                    value={query}
                    onChange={(v) => { setQuery(v); setPage(1); }}
                    placeholder={tab === 'attendance' ? 'Search date, status…' : tab === 'progress' ? 'Search project, note…' : 'Search title, status…'}
                  />
                </div>
                <Input label="From" type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
                <Input label="To" type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
              </div>
              {!isEmployee && (
                <div className="lg:w-64">
                  <Select
                    label="Employee"
                    value={empId}
                    onChange={(e) => { setEmpId(e.target.value); setPage(1); }}
                    options={mockEmployees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` }))}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="secondary" onClick={handleFetch}>
                  <Search size={16} /> {tabMeta[tab].fetchLabel}
                </Button>
                <Button variant="primary" onClick={() => window.print()}>
                  <Printer size={16} /> Print
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Report table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            {tab === 'attendance' && (
              <table className="w-full">
                <thead>
                  <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Date & Day</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Clock In</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Clock Out</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Working Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6E4E8]">
                  {attPage.map((r, i) => (
                    <tr key={r.date} className="hover:bg-[#EAF2F4]/50">
                      <td className="px-6 py-4 text-sm text-gray-500">{(safePage - 1) * pageSize + i + 1}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#263238]">{r.date}</p>
                        <p className="text-xs text-gray-500">{r.weekday}</p>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-green-600">{r.clockIn}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-orange-600">{r.clockOut}</td>
                      <td className="px-6 py-4 text-sm text-[#263238]">{r.hours}</td>
                      <td className="px-6 py-4">{statusPill(r.status)}</td>
                      <td className="px-6 py-4">
                        <button type="button" title="View day" onClick={() => setViewDay(r)} className={actionBtn}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'progress' && (
              <table className="w-full">
                <thead>
                  <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Project</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Progress Note</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6E4E8]">
                  {progPage.map((e, i) => (
                    <tr key={e.id} className="hover:bg-[#EAF2F4]/50">
                      <td className="px-6 py-4 text-sm text-gray-500">{(safePage - 1) * pageSize + i + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{slash(e.submissionDate)}</td>
                      <td className="px-6 py-4 text-sm font-medium text-[#263238] whitespace-nowrap">{e.projectName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                        <p className="line-clamp-3">{stripHtml(e.description)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          title="View note"
                          onClick={() => setViewNote({ project: e.projectName, date: e.submissionDate, html: e.description })}
                          className={actionBtn}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {tab === 'task' && (
              <table className="w-full">
                <thead>
                  <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">#</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6E4E8]">
                  {taskPage.map((w, i) => (
                    <tr key={w.id} className="hover:bg-[#EAF2F4]/50">
                      <td className="px-6 py-4 text-sm text-gray-500">{(safePage - 1) * pageSize + i + 1}</td>
                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{slash(w.date)}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-[#263238]">{w.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{w.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={WORK_STATUS_BADGE[w.status] || 'neutral'}>{w.status}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <button type="button" title="View task" onClick={() => setViewTask(w)} className={actionBtn}>
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {rowCount === 0 && (
              <div className="p-6">
                <EmptyState
                  title="No records found"
                  description="No records in this range. Adjust the dates or search and fetch again."
                />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-[#D6E4E8] bg-white px-6 py-3 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Records per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="rounded-lg border border-[#D6E4E8] bg-white px-2 py-1.5 text-sm text-[#263238] outline-none focus:border-[#024fa7] focus:ring-2 focus:ring-[#024fa7]/20"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <p className="text-sm text-gray-500">{start} - {end} of {rowCount}</p>
            <div className="flex items-center gap-1">
              <button type="button" disabled={safePage <= 1} onClick={() => setPage(1)} title="First page" className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                <ChevronsLeft size={16} />
              </button>
              <button type="button" disabled={safePage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} title="Previous page" className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium cursor-pointer ${p === safePage ? 'bg-[#024fa7] text-white' : 'text-gray-500 hover:bg-[#EAF2F4]'}`}
                >
                  {p}
                </button>
              ))}
              <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} title="Next page" className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                <ChevronRight size={16} />
              </button>
              <button type="button" disabled={safePage >= totalPages} onClick={() => setPage(totalPages)} title="Last page" className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </Card>

        {/* Export library (existing detailed PDFs) */}
        <div>
          <h3 className="text-base font-semibold text-[#17324D]">Export Library</h3>
          <p className="text-sm text-gray-500 mt-0.5 mb-4">Attendance · Progress · Payroll · Expenses — full record-level PDFs</p>
          <Card padding="sm" className="mb-4">
            <div className="sm:max-w-sm">
              <SearchBar value={search} onChange={setSearch} placeholder="Search reports…" />
            </div>
          </Card>
          {filtered.length === 0 ? (
            <EmptyState title="No reports found" description={`No reports match "${search}".`} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((report) => (
                <Card key={report.id} hover>
                  <div className="flex items-start gap-3">
                    <div className="bg-[#EAF2F4] p-3 rounded-lg"><report.icon size={22} className="text-[#024fa7]" /></div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-[#17324D]">{report.name}</h4>
                      <p className="text-xs text-gray-500 mt-1">{report.description}</p>
                      <p className="text-[11px] text-gray-400 mt-1">{report.records} · PDF</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport(report.id)}
                          loading={downloading === report.id}
                          disabled={downloading !== null}
                        >
                          {!downloading && <Download size={14} />}
                          {downloading === report.id ? 'Exporting…' : 'Export'}
                        </Button>
                        <span className="text-xs text-gray-400">{report.category}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Day detail */}
      <Modal isOpen={!!viewDay} onClose={() => setViewDay(null)} title={viewDay ? `Attendance — ${slash(viewDay.date)}` : 'Attendance'}>
        {viewDay && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-[#EAF2F4]/60 border border-[#D6E4E8] px-4 py-3">
                <p className="text-xs text-gray-500">Clock In</p>
                <p className="font-semibold text-green-600">{viewDay.clockIn}</p>
              </div>
              <div className="rounded-lg bg-[#EAF2F4]/60 border border-[#D6E4E8] px-4 py-3">
                <p className="text-xs text-gray-500">Clock Out</p>
                <p className="font-semibold text-orange-600">{viewDay.clockOut}</p>
              </div>
              <div className="rounded-lg bg-[#EAF2F4]/60 border border-[#D6E4E8] px-4 py-3">
                <p className="text-xs text-gray-500">Working Hours</p>
                <p className="font-semibold text-[#17324D]">{viewDay.hours}</p>
              </div>
              <div className="rounded-lg bg-[#EAF2F4]/60 border border-[#D6E4E8] px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                {statusPill(viewDay.status)}
              </div>
            </div>
            <p className="text-xs text-gray-500">{viewDay.weekday} · {scopeName}</p>
          </div>
        )}
      </Modal>

      {/* Progress note */}
      <Modal isOpen={!!viewNote} onClose={() => setViewNote(null)} title={viewNote?.project ?? 'Progress Note'} size="lg">
        {viewNote && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Submitted on {dash(viewNote.date)}</p>
            <div
              dangerouslySetInnerHTML={{ __html: viewNote.html }}
              className="max-h-[50vh] space-y-2 overflow-y-auto rounded-lg border border-[#D6E4E8] bg-[#F8FBFC] p-4 text-sm leading-relaxed text-[#263238] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-[#024fa7] [&_a]:underline"
            />
          </div>
        )}
      </Modal>

      {/* Task detail */}
      <Modal isOpen={!!viewTask} onClose={() => setViewTask(null)} title={viewTask?.title ?? 'Task'}>
        {viewTask && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={WORK_STATUS_BADGE[viewTask.status] || 'neutral'}>{viewTask.status}</Badge>
              <span className="text-xs text-gray-500">{slash(viewTask.date)} · {viewTask.employeeName}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{viewTask.description}</p>
            {viewTask.link && (
              <a href={viewTask.link} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#024fa7] hover:underline">
                View attached link
              </a>
            )}
          </div>
        )}
      </Modal>

      {/* Print document (browser Print → Save as PDF) */}
      <div className="report-print-area">
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>CodeQor HRMS</h1>
          <h2 style={{ fontSize: 13, fontWeight: 600, margin: '6px 0 0' }}>{tabMeta[tab].title}</h2>
          <p style={{ fontSize: 11, margin: '4px 0 0' }}>
            From: {from} <span style={{ margin: '0 12px' }}>To: {to}</span> <span>Employee: {scopeName}</span>
          </p>
        </div>
        {tab === 'attendance' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Sr#', 'Date & Day', 'Clock In', 'Clock Out', 'Working Hours', 'Status'].map((h) => (
                  <th key={h} style={{ border: '1px solid #333', padding: '4px 6px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendanceRows.map((r, i) => (
                <tr key={r.date}>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{i + 1}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{r.date}<br />{r.weekday}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{r.clockIn}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{r.clockOut}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{r.hours}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px', color: PRINT_STATUS_COLOR[r.status], fontWeight: 700 }}>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'progress' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Sr#', 'Date', 'Employee Name', 'Project Title', 'Progress Note'].map((h) => (
                  <th key={h} style={{ border: '1px solid #333', padding: '4px 6px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {progressRows.map((e, i) => (
                <tr key={e.id}>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{i + 1}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{slash(e.submissionDate)}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{e.employeeName}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{e.projectName}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{stripHtml(e.description)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {tab === 'task' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Sr#', 'Date', 'Employee Name', 'Title', 'Details', 'Status'].map((h) => (
                  <th key={h} style={{ border: '1px solid #333', padding: '4px 6px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {taskRows.map((w, i) => (
                <tr key={w.id}>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{i + 1}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{slash(w.date)}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{w.employeeName}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{w.title}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{w.description}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px', fontWeight: 700 }}>{w.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p style={{ fontSize: 10, marginTop: 8 }}>Generated {new Date().toISOString().slice(0, 16).replace('T', ' ')} · {rowCount} records · CodeQor HRMS</p>
      </div>
    </DashboardLayout>
  );
}
