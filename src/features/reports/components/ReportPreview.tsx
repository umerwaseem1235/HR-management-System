'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye } from 'lucide-react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/shared';
import type { DailyWork, ProgressEntry } from '@/types';
import type { AttendanceDayRow, TabId } from '../types';
import { PRINT_STATUS_COLOR, PAGE_SIZES, slash, stripHtml } from '../hooks/useReports';

const actionBtn =
  'p-1.5 rounded-lg bg-[#EAF2F4] text-[#0F8B8D] hover:bg-[#D6E4E8] cursor-pointer';

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
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`skeleton-${i}`} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-8 rounded bg-[#EAF2F4]" /></td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-24 rounded bg-[#EAF2F4]" />
                        <div className="mt-1.5 h-3 w-16 rounded bg-[#EAF2F4]" />
                      </td>
                      <td className="px-6 py-4"><div className="h-4 w-14 rounded bg-[#EAF2F4]" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-14 rounded bg-[#EAF2F4]" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-16 rounded bg-[#EAF2F4]" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 rounded-full bg-[#EAF2F4]" /></td>
                      <td className="px-6 py-4"><div className="h-8 w-8 rounded-lg bg-[#EAF2F4]" /></td>
                    </tr>
                  ))
                ) : (
                  attPage.map((r, i) => (
                  <tr key={r.date} className="hover:bg-[#EAF2F4]/50">
                    <td className="px-6 py-4 text-sm text-gray-500">{(safePage - 1) * pageSize + i + 1}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#263238]">{r.date}</p>
                      <p className="text-xs text-gray-500">{r.weekday}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-green-600">{r.clockIn}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-orange-600">{r.clockOut}</td>
                    <td className="px-6 py-4 text-sm text-[#263238]">{r.hours}</td>
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
                <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">#</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee Name</th>
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
                    <td className="px-6 py-4 text-sm font-medium text-[#263238] whitespace-nowrap">{e.employeeName || '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{slash(e.submissionDate)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-[#263238] whitespace-nowrap">{e.projectName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                      <p className="line-clamp-3">{stripHtml(e.description)}</p>
                    </td>
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

        <div className="flex flex-col gap-3 border-t border-[#D6E4E8] bg-white px-6 py-3 sm:flex-row sm:items-center sm:justify-end">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Records per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { onPageSizeChange(Number(e.target.value)); }}
              className="rounded-lg border border-[#D6E4E8] bg-white px-2 py-1.5 text-sm text-[#263238] outline-none focus:border-[#024fa7] focus:ring-2 focus:ring-[#024fa7]/20"
            >
              {PAGE_SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <p className="text-sm text-gray-500">{start} - {end} of {rowCount}</p>
          <div className="flex items-center gap-1">
            <button type="button" disabled={safePage <= 1} onClick={onFirst} title="First page" className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <ChevronsLeft size={16} />
            </button>
            <button type="button" disabled={safePage <= 1} onClick={onPrev} title="Previous page" className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onSelectPage(p)}
                className={`w-8 h-8 rounded-lg text-sm font-medium cursor-pointer ${p === safePage ? 'bg-[#024fa7] text-white' : 'text-gray-500 hover:bg-[#EAF2F4]'}`}
              >
                {p}
              </button>
            ))}
            <button type="button" disabled={safePage >= totalPages} onClick={onNext} title="Next page" className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <ChevronRight size={16} />
            </button>
            <button type="button" disabled={safePage >= totalPages} onClick={onLast} title="Last page" className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
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
        <p style={{ fontSize: 10, marginTop: 8 }}>Generated {new Date().toISOString().slice(0, 16).replace('T', ' ')} · {rowCount} records · CodQor HRMS</p>
      </div>
    </>
  );
}
