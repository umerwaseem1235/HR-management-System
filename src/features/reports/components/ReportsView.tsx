'use client';

import { FileDown } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/shared';
import type { TabId } from '../types';
import { dash, slash, useReports } from '../hooks/useReports';
import ReportFilters from './ReportFilters';
import ReportPreview from './ReportPreview';

export default function ReportsView() {
  const r = useReports();

  if (!r.user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        actions={
          <Button variant="primary" size="md" onClick={r.handleDownloadPDF} loading={r.downloading} disabled={r.downloading}>
            {!r.downloading && <FileDown size={16} />}
            {r.downloading ? 'Building PDF…' : 'Download PDF'}
          </Button>
        }
      />

      {/* Tab switcher */}
      <div className="inline-flex rounded-xl bg-[#EAF2F4] p-1">
        {(['attendance', 'progress', 'task'] as TabId[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => r.switchTab(t)}
            className={`rounded-lg px-6 py-2 text-sm capitalize transition-all cursor-pointer ${
              r.tab === t ? 'bg-white font-semibold text-[#17324D] shadow-sm' : 'font-medium text-gray-500 hover:text-[#17324D]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <ReportFilters
        tab={r.tab}
        fetchLabel={r.tabMeta[r.tab].fetchLabel}
        draftFrom={r.draftFrom}
        onDraftFromChange={r.setDraftFrom}
        draftTo={r.draftTo}
        onDraftToChange={r.setDraftTo}
        isEmployee={r.isEmployee}
        empId={r.empId}
        employees={r.employees}
        employeesLoading={r.employeesLoading}
        onEmpIdChange={(v) => { r.setEmpId(v); r.setPage(1); }}
        query={r.query}
        onQueryChange={(v) => { r.setQuery(v); r.setPage(1); }}
        queryPlaceholder={r.tab === 'attendance' ? 'Search date, status…' : r.tab === 'progress' ? 'Search employee, project, note…' : 'Search title, status…'}
        onFetch={r.handleFetch}
        onPrint={() => window.print()}
      />

      <ReportPreview
        tab={r.tab}
        title={r.tabMeta[r.tab].title}
        rowCount={r.rowCount}
        isLoading={r.tab === 'attendance' ? r.attendanceLoading : false}
        attPage={r.attPage}
        progPage={r.progPage}
        taskPage={r.taskPage}
        attendanceRows={r.attendanceRows}
        progressRows={r.progressRows}
        taskRows={r.taskRows}
        scopeName={r.scopeName}
        from={r.from}
        to={r.to}
        pageSize={r.pageSize}
        onPageSizeChange={(n) => { r.setPageSize(n); r.setPage(1); }}
        safePage={r.safePage}
        totalPages={r.totalPages}
        start={r.start}
        end={r.end}
        onFirst={() => r.setPage(1)}
        onPrev={() => r.setPage((p) => Math.max(1, p - 1))}
        onSelectPage={r.setPage}
        onNext={() => r.setPage((p) => Math.min(r.totalPages, p + 1))}
        onLast={() => r.setPage(r.totalPages)}
        onViewDay={r.setViewDay}
        onViewNote={r.setViewNote}
        onViewTask={r.setViewTask}
      />

      {/* Day detail */}
      <Modal isOpen={!!r.viewDay} onClose={() => r.setViewDay(null)} title={r.viewDay ? `Attendance — ${slash(r.viewDay.date)}` : 'Attendance'}>
        {r.viewDay && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-[#EAF2F4]/60 border border-[#D6E4E8] px-4 py-3">
                <p className="text-xs text-gray-500">Clock In</p>
                <p className="font-semibold text-green-600">{r.viewDay.clockIn}</p>
              </div>
              <div className="rounded-lg bg-[#EAF2F4]/60 border border-[#D6E4E8] px-4 py-3">
                <p className="text-xs text-gray-500">Clock Out</p>
                <p className="font-semibold text-orange-600">{r.viewDay.clockOut}</p>
              </div>
              <div className="rounded-lg bg-[#EAF2F4]/60 border border-[#D6E4E8] px-4 py-3">
                <p className="text-xs text-gray-500">Working Hours</p>
                <p className="font-semibold text-[#17324D]">{r.viewDay.hours}</p>
              </div>
              <div className="rounded-lg bg-[#EAF2F4]/60 border border-[#D6E4E8] px-4 py-3">
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <StatusBadge status={r.viewDay.status} />
              </div>
            </div>
            <p className="text-xs text-gray-500">{r.viewDay.weekday} · {r.scopeName}</p>
          </div>
        )}
      </Modal>

      {/* Progress note */}
      <Modal isOpen={!!r.viewNote} onClose={() => r.setViewNote(null)} title={r.viewNote?.project ?? 'Progress Note'} size="lg">
        {r.viewNote && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500">Submitted on {dash(r.viewNote.date)}</p>
            <div
              dangerouslySetInnerHTML={{ __html: r.viewNote.html }}
              className="max-h-[50vh] space-y-2 overflow-y-auto rounded-lg border border-[#D6E4E8] bg-[#F8FBFC] p-4 text-sm leading-relaxed text-[#263238] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-[#024fa7] [&_a]:underline"
            />
          </div>
        )}
      </Modal>

      {/* Task detail */}
      <Modal isOpen={!!r.viewTask} onClose={() => r.setViewTask(null)} title={r.viewTask?.title ?? 'Task'}>
        {r.viewTask && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={r.viewTask.status} />
              <span className="text-xs text-gray-500">{slash(r.viewTask.date)} · {r.viewTask.employeeName}</span>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{r.viewTask.description}</p>
            {r.viewTask.link && (
              <a href={r.viewTask.link} target="_blank" rel="noreferrer" className="text-sm font-medium text-[#024fa7] hover:underline">
                View attached link
              </a>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
