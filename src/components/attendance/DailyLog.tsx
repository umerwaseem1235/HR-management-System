'use client';

import { CalendarDays, UserPlus } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Input from '../ui/Input';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import type { AttendanceRecord } from '../../lib/types';
import { earlyLeave, lateBy, minutesToHrs, todayStr } from './attendance-utils';
import { StatusBadge } from './StatusBadge';

interface DailyLogProps {
  viewDate: string;
  records: AttendanceRecord[];
  onViewDate: (v: string) => void;
  onManualOpen: () => void;
}

export default function DailyLog({ viewDate, records, onViewDate, onManualOpen }: DailyLogProps) {
  return (
    <>
      <Card padding="sm">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="sm:w-[200px] shrink-0">
            <Input type="date" label="Date" value={viewDate} onChange={(e) => onViewDate(e.target.value)} />
          </div>
          <div className="flex gap-2 sm:ml-auto shrink-0">
            <Button variant="primary" onClick={() => onViewDate(todayStr())} className="whitespace-nowrap">
              <CalendarDays size={16} /> Today
            </Button>
            <Button variant="secondary" onClick={onManualOpen} className="whitespace-nowrap">
              <UserPlus size={16} /> Manual Entry
            </Button>
          </div>
        </div>
      </Card>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6E4E8]">
              {records.map(att => {
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {records.length === 0 && (
          <div className="p-6">
            <EmptyState title="No records for this date" description={`No attendance records found for ${viewDate}. Use Manual Entry to add one.`} />
          </div>
        )}
      </Card>
    </>
  );
}
