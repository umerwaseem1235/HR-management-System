'use client';

import React from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { STATUS_COLORS, WORK_STATUS_BADGE, slash, dash, type AttendanceDayRow } from './report-utils';
import type { DailyWork } from '../../lib/types';

function statusPill(status: string) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

interface ReportModalsProps {
  viewDay: AttendanceDayRow | null;
  onCloseDay: () => void;
  viewNote: { project: string; date: string; html: string } | null;
  onCloseNote: () => void;
  viewTask: DailyWork | null;
  onCloseTask: () => void;
  scopeName: string;
}

export default function ReportModals({
  viewDay,
  onCloseDay,
  viewNote,
  onCloseNote,
  viewTask,
  onCloseTask,
  scopeName,
}: ReportModalsProps) {
  return (
    <>
      {/* Day detail */}
      <Modal isOpen={!!viewDay} onClose={onCloseDay} title={viewDay ? `Attendance — ${slash(viewDay.date)}` : 'Attendance'}>
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
      <Modal isOpen={!!viewNote} onClose={onCloseNote} title={viewNote?.project ?? 'Progress Note'} size="lg">
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
      <Modal isOpen={!!viewTask} onClose={onCloseTask} title={viewTask?.title ?? 'Task'}>
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
    </>
  );
}
