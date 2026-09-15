'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { FileDown } from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';
import { downloadReport, downloadAllReportsPack, type ReportId } from '../../lib/reports-pdf';
import { useAuth } from '../../contexts/AuthContext';
import { useRequireAuth, AuthLoadingFallback } from '../../components/auth/RequireAuth';
import { useProgress } from '../../contexts/ProgressContext';
import { useWork } from '../../contexts/WorkContext';
import type { DailyWork } from '../../lib/types';
import {
  defaultRange,
  stripHtml,
  buildAttendanceDays,
  type AttendanceDayRow,
  type TabId,
} from '../../components/reports/report-utils';
import ReportTabs from '../../components/reports/ReportTabs';
import ReportFilters from '../../components/reports/ReportFilters';
import { AttendanceTable, ProgressTable, TaskTable } from '../../components/reports/ReportTables';
import ReportPagination from '../../components/reports/ReportPagination';
import ExportLibrary from '../../components/reports/ExportLibrary';
import ReportModals from '../../components/reports/ReportModals';
import PrintDocument from '../../components/reports/PrintDocument';

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

  useRequireAuth();
  if (!user) return <AuthLoadingFallback />;

  const tabMeta: Record<TabId, { title: string; fetchLabel: string }> = {
    attendance: { title: 'Attendance & Leave Report', fetchLabel: 'Fetch Report' },
    progress: { title: 'Progress Report', fetchLabel: 'Search' },
    task: { title: 'Task Report', fetchLabel: 'Fetch Report' },
  };

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
        <ReportTabs tab={tab} onChange={switchTab} />

        {/* Filters */}
        <ReportFilters
          tab={tab}
          query={query}
          onQueryChange={(v) => { setQuery(v); setPage(1); }}
          draftFrom={draftFrom}
          draftTo={draftTo}
          onDraftFromChange={setDraftFrom}
          onDraftToChange={setDraftTo}
          isEmployee={!!isEmployee}
          empId={empId}
          onEmpIdChange={(v) => { setEmpId(v); setPage(1); }}
          fetchLabel={tabMeta[tab].fetchLabel}
          onFetch={handleFetch}
          onPrint={() => window.print()}
        />

        {/* Report table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            {tab === 'attendance' && (
              <AttendanceTable rows={attPage} offset={(safePage - 1) * pageSize} onView={setViewDay} />
            )}

            {tab === 'progress' && (
              <ProgressTable rows={progPage} offset={(safePage - 1) * pageSize} onView={setViewNote} />
            )}

            {tab === 'task' && (
              <TaskTable rows={taskPage} offset={(safePage - 1) * pageSize} onView={setViewTask} />
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

          <ReportPagination
            pageSize={pageSize}
            onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
            start={start}
            end={end}
            rowCount={rowCount}
            safePage={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </Card>

        {/* Export library (existing detailed PDFs) */}
        <ExportLibrary
          search={search}
          onSearchChange={setSearch}
          downloading={downloading}
          onExport={handleExport}
        />
      </div>

      <ReportModals
        viewDay={viewDay}
        onCloseDay={() => setViewDay(null)}
        viewNote={viewNote}
        onCloseNote={() => setViewNote(null)}
        viewTask={viewTask}
        onCloseTask={() => setViewTask(null)}
        scopeName={scopeName}
      />

      {/* Print document (browser Print → Save as PDF) */}
      <PrintDocument
        tab={tab}
        title={tabMeta[tab].title}
        from={from}
        to={to}
        scopeName={scopeName}
        attendanceRows={attendanceRows}
        progressRows={progressRows}
        taskRows={taskRows}
        rowCount={rowCount}
      />
    </DashboardLayout>
  );
}
