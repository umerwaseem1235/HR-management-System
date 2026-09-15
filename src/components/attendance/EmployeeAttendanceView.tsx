'use client';

import { CalendarDays, Clock, UserCheck, UserX, X } from 'lucide-react';
import Card from '../ui/Card';
import PageHeader from '../ui/PageHeader';
import StatCard from '../ui/StatCard';
import Select from '../ui/Select';
import Input from '../ui/Input';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import type { AttendanceRecord } from '../../lib/types';
import { STATUS_OPTIONS } from './attendance-utils';
import { StatusBadge } from './StatusBadge';

interface EmployeeAttendanceViewProps {
  monthLabel: string;
  records: AttendanceRecord[];
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leavesTaken: number;
  selectedDate: string;
  statusFilter: string;
  onSelectedDate: (v: string) => void;
  onStatusFilter: (v: string) => void;
}

export default function EmployeeAttendanceView({
  monthLabel, records, presentDays, absentDays, lateDays, leavesTaken,
  selectedDate, statusFilter, onSelectedDate, onStatusFilter,
}: EmployeeAttendanceViewProps) {
  const filtered = records.filter(
    (att) => (!statusFilter || att.status === statusFilter) && (!selectedDate || att.date === selectedDate),
  );

  return (
    <div className="space-y-6">
      <PageHeader title="My Attendance" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Present Days" value={presentDays} change={monthLabel} icon={<UserCheck size={18} strokeWidth={1.6} className="text-[#024fa7]" />} iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Absent Days" value={absentDays} change={monthLabel} icon={<UserX size={18} strokeWidth={1.6} className="text-[#024fa7]" />} iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Late Days" value={lateDays} change={monthLabel} icon={<Clock size={18} strokeWidth={1.6} className="text-[#024fa7]" />} iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Leaves Taken" value={leavesTaken} change={monthLabel} icon={<CalendarDays size={18} strokeWidth={1.6} className="text-[#024fa7]" />} iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
      </div>

      <Card padding="sm">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="w-full sm:w-52 shrink-0">
            <Input type="date" label="Select date" value={selectedDate} onChange={(e) => onSelectedDate(e.target.value)} />
          </div>
          <div className="w-full sm:w-44 shrink-0 sm:ml-auto">
            <Select value={statusFilter} onChange={(e) => onStatusFilter(e.target.value)} options={STATUS_OPTIONS} />
          </div>
          {selectedDate && (
            <Button variant="outline" size="sm" onClick={() => onSelectedDate('')} className="shrink-0">
              <X size={14} /> Clear
            </Button>
          )}
        </div>
      </Card>

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
              {filtered.map((att) => (
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
          {filtered.length === 0 && (
            <div className="p-6">
              <EmptyState title="No attendance records" description={`No attendance records found for ${monthLabel}.`} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
