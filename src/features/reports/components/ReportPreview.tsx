'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye } from 'lucide-react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import Select from '@/components/ui/Select';
import { EmployeeCell, StatusBadge } from '@/components/shared';
import type { DailyWork, ProgressEntry } from '@/types';
import type { AttendanceDayRow, TabId } from '../types';
import { PRINT_STATUS_COLOR, PAGE_SIZES, slash } from '../hooks/useReports';

const actionBtn =
  'p-1.5 rounded-lg bg-blue-gray text-[#0F8B8D] hover:bg-medium-gray cursor-pointer';

/** "2026-09-28" -> weekday name; empty string when the date is invalid. */
function weekdayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'long' });
}

interface ReportPreviewProps {
  tab: TabId;
  title: string;
  rowCount: number;
  isLoading?: boolean;
  attPage: AttendanceDayRow[];
  progPage: ProgressEntry[];
  taskPage: DailyWork[];
  attendanceRows: AttendanceDayRow[];
  progressRows: ProgressEntry[];
  taskRows: DailyWork[];
  scopeName: string;
  from: string;
  to: string;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  safePage: number;
  totalPages: number;
  start: number;
  end: number;
  onFirst: () => void;
  onPrev: () => void;
  onSelectPage: (p: number) => void;
  onNext: () => void;
  onLast: () => void;
  onViewDay: (r: AttendanceDayRow) => void;
  onViewNote: (v: { project: string; date: string; html: string }) => void;
  onViewTask: (w: DailyWork) => void;
}

export default function ReportPreview({
  tab, title, rowCount, isLoading, attPage, progPage, taskPage,
  attendanceRows, progressRows, taskRows, scopeName, from, to,
  pageSize, onPageSizeChange, safePage, totalPages, start, end,
  onFirst, onPrev, onSelectPage, onNext, onLast,
  onViewDay, onViewNote, onViewTask,
}: ReportPreviewProps) {
  return (
    <>
      {/* Report table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          {tab === 'attendance' && (
            <table className="w-full">
              <thead>
                <tr className="bg-blue-gray border-b border-medium-gray">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Date & Day</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Working Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-medium-gray">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-8 rounded bg-blue-gray" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-14 rounded bg-blue-gray" /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-gray" />
                          <div className="h-4 w-24 rounded bg-blue-gray" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 rounded bg-blue-gray" />
                        <div className="mt-1.5 h-3 w-16 rounded bg-blue-gray" />
                      </td>
                      <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-blue-gray" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 rounded-full bg-blue-gray" /></td>
                      <td className="px-6 py-4"><div className="h-8 w-8 rounded-lg bg-blue-gray" /></td>
                    </tr>
                  ))
                ) : (
                  attPage.map((r, i) => (
                  <tr key={r.date} className="hover:bg-blue-gray dark:hover:bg-white/10/50">
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{(safePage - 1) * pageSize + i + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-dark-text dark:text-gray-100 whitespace-nowrap">{r.employeeCode ?? r.employeeId ?? '—'}</td>
                    <td className="px-6 py-4"><EmployeeCell name={r.employeeName || scopeName || '—'} employeeId={r.employeeId} avatar={r.employeeAvatar} size="sm" /></td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-dark-text dark:text-gray-100">{r.date}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{r.weekday}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-dark-text dark:text-gray-100">{r.hours}</td>
                    <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-4">
                      <button type="button" title="View day" onClick={() => onViewDay(r)} className={actionBtn}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {tab === 'progress' && (
            <table className="w-full">
              <thead>
                <tr className="bg-blue-gray border-b border-medium-gray">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Employee ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Date & Day</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Project</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-medium-gray">
                {progPage.map((e, i) => (
                  <tr key={e.id} className="hover:bg-blue-gray dark:hover:bg-white/10/50">
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{(safePage - 1) * pageSize + i + 1}</td>
                    <td className="px-6 py-4 text-sm font-medium text-dark-text dark:text-gray-100 whitespace-nowrap">{e.employeeCode ?? e.employeeId}</td>
                    <td className="px-6 py-4"><EmployeeCell name={e.employeeName || scopeName || '—'} employeeId={e.employeeId} avatar={e.employeeAvatar} size="sm" /></td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-dark-text dark:text-gray-100">{slash(e.submissionDate)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{weekdayOf(e.submissionDate)}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-dark-text dark:text-gray-100 whitespace-nowrap">{e.projectName}</td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        title="View note"
                        onClick={() => onViewNote({ project: e.projectName, date: e.submissionDate, html: e.description })}
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
                <tr className="bg-blue-gray border-b border-medium-gray">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-medium-gray">
                {taskPage.map((w, i) => (
                  <tr key={w.id} className="hover:bg-blue-gray dark:hover:bg-white/10/50">
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{(safePage - 1) * pageSize + i + 1}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 whitespace-nowrap">{slash(w.date)}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-dark-text dark:text-gray-100">{w.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 line-clamp-1">{w.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={w.status} />
                    </td>
                    <td className="px-6 py-4">
                      <button type="button" title="View task" onClick={() => onViewTask(w)} className={actionBtn}>
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {rowCount === 0 && !isLoading && (
            <div className="p-6">
              <EmptyState
                title="No records found"
                description={tab === 'attendance'
                  ? 'No attendance records in the database for this employee and range. Mark attendance first, then fetch again.'
                  : tab === 'progress'
                    ? 'No progress entries in the database for this employee and range.'
                    : 'No records in this range. Adjust the dates or search and fetch again.'}
              />
            </div>
          )}
        </div>

        {/* Pagination footer — only when data exceeds one page (e.g. > pageSize rows). */}
        {totalPages > 1 && (
        <div className="flex flex-col gap-3 border-t border-medium-gray bg-white dark:bg-[#1b263b] px-6 py-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            <span>Records per page:</span>
            <div className="w-[76px] shrink-0">
              <Select
                size="sm"
                ariaLabel="Records per page"
                value={String(pageSize)}
                onChange={(e) => { onPageSizeChange(Number(e.target.value)); }}
                options={PAGE_SIZES.map((s) => ({ value: String(s), label: String(s) }))}
              />
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{start} - {end} of {rowCount}</p>
          <div className="flex items-center gap-1">
            <button type="button" disabled={safePage <= 1} onClick={onFirst} title="First page" className="p-2 rounded-lg text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-blue-gray dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <ChevronsLeft size={16} />
            </button>
            <button type="button" disabled={safePage <= 1} onClick={onPrev} title="Previous page" className="p-2 rounded-lg text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-blue-gray dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onSelectPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium cursor-pointer ${p === safePage ? 'bg-teal text-white' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-blue-gray dark:hover:bg-white/10'}`}
              >
                {p}
              </button>
            ))}
            <button type="button" disabled={safePage >= totalPages} onClick={onNext} title="Next page" className="p-2 rounded-lg text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-blue-gray dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <ChevronRight size={16} />
            </button>
            <button type="button" disabled={safePage >= totalPages} onClick={onLast} title="Last page" className="p-2 rounded-lg text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-blue-gray dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
        )}
      </Card>

      {/* Print document (browser Print → Save as PDF) */}
      <div className="report-print-area">
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>CodQor HRMS</h1>
          <h2 style={{ fontSize: 13, fontWeight: 600, margin: '6px 0 0' }}>{title}</h2>
          <p style={{ fontSize: 11, margin: '4px 0 0' }}>
            From: {from} <span style={{ margin: '0 12px' }}>To: {to}</span> <span>Employee: {scopeName}</span>
          </p>
        </div>
        {tab === 'attendance' && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr>
                {['Sr#', 'Employee ID', 'Employee', 'Date & Day', 'Working Hours', 'Status'].map((h) => (
                  <th key={h} style={{ border: '1px solid #333', padding: '4px 6px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attendanceRows.map((r, i) => (
                <tr key={r.date}>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{i + 1}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{r.employeeCode ?? r.employeeId ?? '—'}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{r.employeeName || scopeName || '—'}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{r.date}<br />{r.weekday}</td>
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
                {['Sr#', 'Employee ID', 'Employee', 'Date & Day', 'Project'].map((h) => (
                  <th key={h} style={{ border: '1px solid #333', padding: '4px 6px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {progressRows.map((e, i) => (
                <tr key={e.id}>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{i + 1}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{e.employeeCode ?? e.employeeId}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{e.employeeName}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{slash(e.submissionDate)}<br />{weekdayOf(e.submissionDate)}</td>
                  <td style={{ border: '1px solid #333', padding: '4px 6px' }}>{e.projectName}</td>
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
        <p style={{ fontSize: 10, marginTop: 8 }}>Generated {new Date().toISOString().slice(0, 16).replace('T', ' ')} · {rowCount} records · CodQor HRMS</p>
      </div>
    </>
  );
}
