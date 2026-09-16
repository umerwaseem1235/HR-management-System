'use client';

import { CalendarDays, Clock, Sun, UserCheck, UserX } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import StatCard from '../ui/StatCard';
import Input from '../ui/Input';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import type { AttendanceRecord } from '../../lib/types';
import { aggregate } from './attendance-utils';
import type { AttendanceAggregate, SummaryMode } from './types';

interface SummariesTabProps {
  mode: SummaryMode;
  viewDate: string;
  records: AttendanceRecord[];
  agg: AttendanceAggregate;
  label: string;
  onModeChange: (m: SummaryMode) => void;
  onViewDate: (v: string) => void;
}

export default function SummariesTab({ mode, viewDate, records, agg, label, onModeChange, onViewDate }: SummariesTabProps) {
  return (
    <>
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Button variant={mode === 'daily' ? 'primary' : 'outline'} size="sm" onClick={() => onModeChange('daily')}>Daily</Button>
            <Button variant={mode === 'weekly' ? 'primary' : 'outline'} size="sm" onClick={() => onModeChange('weekly')}>Weekly</Button>
            <Button variant={mode === 'monthly' ? 'primary' : 'outline'} size="sm" onClick={() => onModeChange('monthly')}>Monthly</Button>
          </div>
          <div className="lg:ml-auto lg:w-56">
            <Input type={mode === 'monthly' ? 'month' : 'date'} label="Period" value={viewDate} onChange={(e) => onViewDate(e.target.value)} />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Present" value={agg.present} icon={<UserCheck size={18} strokeWidth={1.6} className="text-[#024fa7]" />} iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" change="employees" />
        <StatCard title="Absent" value={agg.absent} icon={<UserX size={18} strokeWidth={1.6} className="text-[#024fa7]" />} iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" change="employees" />
        <StatCard title="Late" value={agg.late} icon={<Clock size={18} strokeWidth={1.6} className="text-[#024fa7]" />} iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" change="employees" />
        <StatCard title="Half Day" value={agg.halfDay} icon={<Sun size={18} strokeWidth={1.6} className="text-[#024fa7]" />} iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" change="employees" />
        <StatCard title="On Leave" value={agg.leave} icon={<CalendarDays size={18} strokeWidth={1.6} className="text-[#024fa7]" />} iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" change="employees" />
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h3 className="text-base font-semibold text-[#17324D]">{label}</h3>
          <div className="flex gap-2">
            <Badge variant="default">{agg.totalHours.toFixed(1)}h Work Hours</Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[
            { label: 'Present', pct: agg.present ? Math.round((agg.present / Math.max(1, records.length)) * 100) : 0, color: 'bg-green-500' },
            { label: 'Absent', pct: agg.absent ? Math.round((agg.absent / Math.max(1, records.length)) * 100) : 0, color: 'bg-red-500' },
            { label: 'Late', pct: agg.late ? Math.round((agg.late / Math.max(1, records.length)) * 100) : 0, color: 'bg-orange-500' },
            { label: 'Half Day', pct: agg.halfDay ? Math.round((agg.halfDay / Math.max(1, records.length)) * 100) : 0, color: 'bg-yellow-500' },
            { label: 'Leave', pct: agg.leave ? Math.round((agg.leave / Math.max(1, records.length)) * 100) : 0, color: 'bg-blue-500' },
          ].map(item => (
            <div key={item.label} className="rounded-lg border border-[#D6E4E8] bg-[#F8FBFC] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#263238]">{item.label}</p>
                <p className="text-lg font-bold text-[#17324D]">{item.pct}%</p>
              </div>
              <div className="mt-3 h-2 w-full bg-[#EAF2F4] rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employees Logged</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Present</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Absent</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Late</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Total Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6E4E8]">
              {Array.from(new Set(records.map(r => r.date))).sort().reverse().map(date => {
                const dayRecs = records.filter(r => r.date === date);
                const dAgg = aggregate(dayRecs);
                return (
                  <tr key={date} className="hover:bg-[#EAF2F4]/50">
                    <td className="px-6 py-3 text-sm text-gray-600">{date}</td>
                    <td className="px-6 py-3 text-sm text-[#263238]">{dayRecs.length}</td>
                    <td className="px-6 py-3 text-sm text-green-600">{dAgg.present}</td>
                    <td className="px-6 py-3 text-sm text-red-600">{dAgg.absent}</td>
                    <td className="px-6 py-3 text-sm text-orange-600">{dAgg.late}</td>
                    <td className="px-6 py-3 text-sm text-[#263238]">{dAgg.totalHours.toFixed(1)}h</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {records.length === 0 && (
            <div className="p-6">
              <EmptyState title="No records in this period" description="Try a different period or date range." />
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
