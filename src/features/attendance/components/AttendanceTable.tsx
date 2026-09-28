'use client';

import { Pencil } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/shared';
import type { AttendanceRecord } from '@/types';
import { minutesToHrs, formatWorkHours } from '@/utils/date';
import { earlyLeave, lateBy } from '../utils';

export function MyAttendanceTable({ records, monthLabel }: { records: AttendanceRecord[]; monthLabel: string }) {
  return (
    <Card padding="none">
      <div className="px-6 py-4 border-b border-medium-gray">
        <h3 className="text-base font-semibold text-primary dark:text-blue-gray-light">My Attendance — {monthLabel}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-blue-gray border-b border-medium-gray">
            <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Check In</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Check Out</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Work Hours</th>
          </tr></thead>
          <tbody className="divide-y divide-medium-gray">
            {records.map((att) => (
              <tr key={att.id} className="hover:bg-blue-gray dark:hover:bg-white/10/50">
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{att.date}</td>
                <td className="px-6 py-4 text-sm text-dark-text dark:text-gray-100">{att.checkIn || '—'}</td>
                <td className="px-6 py-4 text-sm text-dark-text dark:text-gray-100">{att.checkOut || '—'}</td>
                <td className="px-6 py-4"><StatusBadge status={att.status} /></td>
                <td className="px-6 py-4 text-sm text-dark-text dark:text-gray-100">{formatWorkHours(att.workHours)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {records.length === 0 && (
          <div className="p-6">
            <EmptyState title="No attendance records" description={`No attendance records found for ${monthLabel}.`} />
          </div>
        )}
      </div>
    </Card>
  );
}

export function DailyLogTable({
  records,
  viewDate,
  logSearch,
  onEdit,
  graceMinutes = 15,
}: {
  records: AttendanceRecord[];
  viewDate: string;
  logSearch: string;
  onEdit: (record: AttendanceRecord) => void;
  /** Rule grace so "Late By" matches the configured late-arrival rule. */
  graceMinutes?: number;
}) {
  return (
    <Card padding="none">
      <div className="px-6 py-4 border-b border-medium-gray flex items-center justify-between">
        <h3 className="text-base font-semibold text-primary dark:text-blue-gray-light">Attendance Log — {viewDate}</h3>
        <Badge variant="default">{records.length} employees</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-gray border-b border-medium-gray">
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Check In</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Check Out</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Work Hours</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Late By</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Early Leave</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-medium-gray">
            {records.map((att) => {
              const lb = lateBy(att, graceMinutes);
              const el = earlyLeave(att);
              return (
                <tr key={att.id} className="hover:bg-blue-gray dark:hover:bg-white/10/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={att.employeeName} size="sm" />
                      <p className="text-sm font-medium text-dark-text dark:text-gray-100">{att.employeeName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-dark-text dark:text-gray-100">{att.checkIn || '—'}</td>
                  <td className="px-6 py-4 text-sm text-dark-text dark:text-gray-100">{att.checkOut || '—'}</td>
                  <td className="px-6 py-4"><StatusBadge status={att.status} /></td>
                  <td className="px-6 py-4 text-sm text-dark-text dark:text-gray-100">{formatWorkHours(att.workHours)}</td>
                  <td className="px-6 py-4">
                    {lb > 0 ? <Badge variant="warning">{minutesToHrs(lb)}</Badge> : <span className="text-sm text-gray-400 dark:text-gray-500">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    {el > 0 ? <Badge variant="warning">{minutesToHrs(el)}</Badge> : <span className="text-sm text-gray-400 dark:text-gray-500">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      title="Edit record"
                      onClick={() => onEdit(att)}
                      className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:bg-blue-950/40 cursor-pointer"
                    >
                      <Pencil size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {records.length === 0 && (
        <div className="p-6">
          <EmptyState title="No records for this date" description={logSearch.trim() ? `No records match "${logSearch.trim()}" on ${viewDate}.` : `No attendance records found for ${viewDate}. Use Manual Entry to add one.`} />
        </div>
      )}
    </Card>
  );
}
