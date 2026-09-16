'use client';

import React from 'react';
import { Eye } from 'lucide-react';
import Badge from '../ui/Badge';
import { STATUS_COLORS, WORK_STATUS_BADGE, slash, stripHtml, type AttendanceDayRow } from './report-utils';
import type { ProgressEntry, DailyWork } from '../../lib/types';

const actionBtn =
  'p-1.5 rounded-lg bg-[#EAF2F4] text-[#0F8B8D] hover:bg-[#D6E4E8] cursor-pointer';

function statusPill(status: string) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

interface AttendanceTableProps {
  rows: AttendanceDayRow[];
  offset: number;
  onView: (row: AttendanceDayRow) => void;
}

export function AttendanceTable({ rows, offset, onView }: AttendanceTableProps) {
  return (
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
        {rows.map((r, i) => (
          <tr key={r.date} className="hover:bg-[#EAF2F4]/50">
            <td className="px-6 py-4 text-sm text-gray-500">{offset + i + 1}</td>
            <td className="px-6 py-4">
              <p className="text-sm font-medium text-[#263238]">{r.date}</p>
              <p className="text-xs text-gray-500">{r.weekday}</p>
            </td>
            <td className="px-6 py-4 text-sm font-semibold text-green-600">{r.clockIn}</td>
            <td className="px-6 py-4 text-sm font-semibold text-orange-600">{r.clockOut}</td>
            <td className="px-6 py-4 text-sm text-[#263238]">{r.hours}</td>
            <td className="px-6 py-4">{statusPill(r.status)}</td>
            <td className="px-6 py-4">
              <button type="button" title="View day" onClick={() => onView(r)} className={actionBtn}>
                <Eye size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface ProgressTableProps {
  rows: ProgressEntry[];
  offset: number;
  onView: (note: { project: string; date: string; html: string }) => void;
}

export function ProgressTable({ rows, offset, onView }: ProgressTableProps) {
  return (
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
        {rows.map((e, i) => (
          <tr key={e.id} className="hover:bg-[#EAF2F4]/50">
            <td className="px-6 py-4 text-sm text-gray-500">{offset + i + 1}</td>
            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{slash(e.submissionDate)}</td>
            <td className="px-6 py-4 text-sm font-medium text-[#263238] whitespace-nowrap">{e.projectName}</td>
            <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
              <p className="line-clamp-3">{stripHtml(e.description)}</p>
            </td>
            <td className="px-6 py-4">
              <button
                type="button"
                title="View note"
                onClick={() => onView({ project: e.projectName, date: e.submissionDate, html: e.description })}
                className={actionBtn}
              >
                <Eye size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface TaskTableProps {
  rows: DailyWork[];
  offset: number;
  onView: (task: DailyWork) => void;
}

export function TaskTable({ rows, offset, onView }: TaskTableProps) {
  return (
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
        {rows.map((w, i) => (
          <tr key={w.id} className="hover:bg-[#EAF2F4]/50">
            <td className="px-6 py-4 text-sm text-gray-500">{offset + i + 1}</td>
            <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{slash(w.date)}</td>
            <td className="px-6 py-4">
              <p className="text-sm font-medium text-[#263238]">{w.title}</p>
              <p className="text-xs text-gray-500 line-clamp-1">{w.description}</p>
            </td>
            <td className="px-6 py-4">
              <Badge variant={WORK_STATUS_BADGE[w.status] || 'neutral'}>{w.status}</Badge>
            </td>
            <td className="px-6 py-4">
              <button type="button" title="View task" onClick={() => onView(w)} className={actionBtn}>
                <Eye size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
