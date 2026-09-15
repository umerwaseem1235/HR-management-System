'use client';

import { Pencil } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/shared';
import type { AttendanceRecord } from '@/types';
import { minutesToHrs } from '@/utils/date';
import { earlyLeave, lateBy } from '../utils';

export function MyAttendanceTable({ records, monthLabel }: { records: AttendanceRecord[]; monthLabel: string }) {
  return (
    <Card padding="none">
      <div className="px-6 py-4 border-b border-[#D6E4E8]">
        <h3 className="text-base font-semibold text-[#17324D]">My Attendance — {monthLabel}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
            <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Check In</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Check Out</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Work Hours</th>
          </tr></thead>
          <tbody className="divide-y divide-[#D6E4E8]">
            {records.map((att) => (
              <tr key={att.id} className="hover:bg-[#EAF2F4]/50">
                <td className="px-6 py-4 text-sm text-gray-500">{att.date}</td>
                <td className="px-6 py-4 text-sm text-[#263238]">{att.checkIn || '—'}</td>
                <td className="px-6 py-4 text-sm text-[#263238]">{att.checkOut || '—'}</td>
                <td className="px-6 py-4"><StatusBadge status={att.status} /></td>
                <td className="px-6 py-4 text-sm text-[#263238]">{att.workHours}h</td>
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
}: {
  records: AttendanceRecord[];
  viewDate: string;
  logSearch: string;
  onEdit: (record: AttendanceRecord) => void;
}) {
  return (
    <Card padding="none">
      <div className="px-6 py-4 border-b border-[#D6E4E8] flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#17324D]">Attendance Log — {viewDate}</h3>
        <Badge variant="default">{records.length} employees</Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Check In</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Check Out</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Work Hours</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Late By</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Early Leave</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-[#17324D] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D6E4E8]">
            {records.map((att) => {
              const lb = lateBy(att);
              const el = earlyLeave(att);
              return (
                <tr key={att.id} className="hover:bg-[#EAF2F4]/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={att.employeeName} size="sm" />
                      <p className="text-sm font-medium text-[#263238]">{att.employeeName}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#263238]">{att.checkIn || '—'}</td>
                  <td className="px-6 py-4 text-sm text-[#263238]">{att.checkOut || '—'}</td>
                  <td className="px-6 py-4"><StatusBadge status={att.status} /></td>
                  <td className="px-6 py-4 text-sm text-[#263238]">{att.workHours}h</td>
                  <td className="px-6 py-4">
                    {lb > 0 ? <Badge variant="warning">{minutesToHrs(lb)}</Badge> : <span className="text-sm text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    {el > 0 ? <Badge variant="warning">{minutesToHrs(el)}</Badge> : <span className="text-sm text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      title="Edit record"
                      onClick={() => onEdit(att)}
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
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
