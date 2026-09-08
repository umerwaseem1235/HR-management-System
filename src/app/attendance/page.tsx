'use client';

import React, { useState, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import EmptyState from '../../components/ui/EmptyState';
import { UserCheck, UserX, Clock, CalendarDays } from 'lucide-react';
import { mockAttendance, mockDashboardStats, mockEmployees, mockLeaveRequests } from '../../lib/mock-data';
import { AttendanceRecord } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'Present', label: 'Present' },
  { value: 'Absent', label: 'Absent' },
  { value: 'Late', label: 'Late' },
  { value: 'Half Day', label: 'Half Day' },
  { value: 'Leave', label: 'Leave' },
];

// Build a deterministic working-day schedule for the current month so the
// employee view has meaningful monthly stats even when mock data has no
// records in the current month. Real mock records for the month take precedence.
function buildMonthlySchedule(employeeId: string, employeeName: string, year: number, month: number): AttendanceRecord[] {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const lastDay = isCurrentMonth ? today.getDate() : daysInMonth;
  const seed = employeeId.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const records: AttendanceRecord[] = [];

  for (let day = 1; day <= lastDay; day++) {
    const date = new Date(year, month, day);
    const weekday = date.getDay();
    if (weekday === 0 || weekday === 6) continue; // skip weekends

    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const r = (day * 13 + seed) % 20;
    const getStatus = (): AttendanceRecord['status'] => {
      if (r === 0) return 'Absent';
      if (r <= 2) return 'Late';
      if (r === 3) return 'Leave';
      return 'Present';
    };
    const status = getStatus();

    const workHours = status === 'Present' ? 8 + ((day + seed) % 12) / 10 : status === 'Late' ? 8.5 : status === 'Half Day' ? 4 : 0;

    records.push({
      id: `gen-${employeeId}-${dateStr}`,
      employeeId,
      employeeName,
      date: dateStr,
      checkIn: status === 'Present' ? '09:00' : status === 'Late' ? '09:35' : status === 'Half Day' ? '09:00' : '',
      checkOut: status === 'Present' || status === 'Late' ? '18:00' : status === 'Half Day' ? '13:00' : '',
      status,
      workHours: Math.round(workHours * 10) / 10,
      overtime: status === 'Present' && (day + seed) % 5 === 0 ? 0.5 : 0,
    });
  }
  return records;
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const stats = mockDashboardStats;

  const isEmployee = user?.role === 'employee';

  const employee = useMemo(() => {
    if (!user) return undefined;
    return (
      mockEmployees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
      mockEmployees.find((e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase())
    );
  }, [user]);

  const { monthLabel, monthlyRecords, presentDays, absentDays, lateDays, leavesTaken } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const empty = { monthLabel, monthlyRecords: [] as AttendanceRecord[], presentDays: 0, absentDays: 0, lateDays: 0, leavesTaken: 0 };
    if (!user || !isEmployee) return empty;

    const empId = employee?.id ?? '';
    const empName = employee ? `${employee.firstName} ${employee.lastName}` : user.name;
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    // Real records for this employee in the current month
    const realMonthly = mockAttendance.filter(
      (a) => (empId ? a.employeeId === empId : a.employeeName.toLowerCase() === user.name.toLowerCase()) && a.date.startsWith(monthPrefix)
    );
    const realDates = new Set(realMonthly.map((r) => r.date));

    // Fill gaps with a deterministic schedule so monthly stats are meaningful
    const generated = empId
      ? buildMonthlySchedule(empId, empName, year, month).filter((r) => !realDates.has(r.date))
      : [];

    const monthlyRecords = [...realMonthly, ...generated].sort((a, b) => (a.date < b.date ? 1 : -1));

    const presentDays = monthlyRecords.filter((r) => r.status === 'Present').length;
    const absentDays = monthlyRecords.filter((r) => r.status === 'Absent').length;
    const lateDays = monthlyRecords.filter((r) => r.status === 'Late').length;
    const attendanceLeaveDates = new Set(monthlyRecords.filter((r) => r.status === 'Leave').map((r) => r.date));

    // Approved leaves overlapping the current month (excluding days already counted via attendance)
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    let approvedLeaveDays = 0;
    mockLeaveRequests
      .filter((l) => (empId ? l.employeeId === empId : l.employeeName.toLowerCase() === user.name.toLowerCase()) && l.status === 'Approved')
      .forEach((l) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
        const overlapStart = start > monthStart ? start : monthStart;
        const overlapEnd = end < monthEnd ? end : monthEnd;
        for (let d = new Date(overlapStart); d <= overlapEnd; d.setDate(d.getDate() + 1)) {
          const ds = toDateStr(d);
          if (!attendanceLeaveDates.has(ds)) approvedLeaveDays++;
        }
      });

    return { monthLabel, monthlyRecords, presentDays, absentDays, lateDays, leavesTaken: attendanceLeaveDates.size + approvedLeaveDays };
  }, [user, isEmployee, employee]);

  if (!user) return null;

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = {
      Present: 'success', Absent: 'danger', Late: 'warning', 'Half Day': 'info', Leave: 'info', Holiday: 'neutral', Weekend: 'neutral',
    };
    return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
  };

  // ---- Employee view: only the logged-in employee's monthly attendance ----
  if (isEmployee) {
    const filteredMine = monthlyRecords.filter((att) => !statusFilter || att.status === statusFilter);

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-[#17324D]">My Attendance</h1>
            <p className="text-sm text-gray-500 mt-1">{monthLabel}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Present Days" value={presentDays} change={monthLabel} icon={<UserCheck size={22} className="text-green-600" />} iconBg="bg-green-50" />
            <StatCard title="Absent Days" value={absentDays} change={monthLabel} icon={<UserX size={22} className="text-red-500" />} iconBg="bg-red-50" />
            <StatCard title="Late Days" value={lateDays} change={monthLabel} icon={<Clock size={22} className="text-orange-500" />} iconBg="bg-orange-50" />
            <StatCard title="Leaves Taken" value={leavesTaken} change={monthLabel} icon={<CalendarDays size={22} className="text-blue-500" />} iconBg="bg-blue-50" />
          </div>

          <Card padding="sm">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar value={search} onChange={setSearch} placeholder="Search by date..." className="flex-1" />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} />
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
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Overtime</th>
                </tr></thead>
                <tbody className="divide-y divide-[#D6E4E8]">
                  {filteredMine
                    .filter((att) => !search || att.date.toLowerCase().includes(search.toLowerCase()))
                    .map((att) => (
                      <tr key={att.id} className="hover:bg-[#EAF2F4]/50">
                        <td className="px-6 py-4 text-sm text-gray-500">{att.date}</td>
                        <td className="px-6 py-4 text-sm text-[#263238]">{att.checkIn || '—'}</td>
                        <td className="px-6 py-4 text-sm text-[#263238]">{att.checkOut || '—'}</td>
                        <td className="px-6 py-4">{statusBadge(att.status)}</td>
                        <td className="px-6 py-4 text-sm text-[#263238]">{att.workHours}h</td>
                        <td className="px-6 py-4 text-sm text-[#263238]">{att.overtime > 0 ? `${att.overtime}h` : '—'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {filteredMine.length === 0 && (
                <div className="p-6">
                  <EmptyState title="No attendance records" description={`No attendance records found for ${monthLabel}.`} />
                </div>
              )}
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // ---- Admin / HR view: unchanged (all employees) ----
  const filtered = mockAttendance.filter(att => {
    const matchSearch = !search || att.employeeName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || att.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-[#17324D]">Attendance</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Present" value={stats.presentToday} icon={<UserCheck size={22} className="text-green-600" />} iconBg="bg-green-50" />
          <StatCard title="Absent" value={stats.absentToday} icon={<UserX size={22} className="text-red-500" />} iconBg="bg-red-50" />
          <StatCard title="Late" value={stats.lateToday} icon={<Clock size={22} className="text-orange-500" />} iconBg="bg-orange-50" />
          <StatCard title="On Leave" value={stats.onLeaveToday} icon={<CalendarDays size={22} className="text-blue-500" />} iconBg="bg-blue-50" />
        </div>

        <Card padding="sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search employee..." className="flex-1" />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} />
          </div>
        </Card>

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Check In</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Check Out</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Work Hours</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Overtime</th>
              </tr></thead>
              <tbody className="divide-y divide-[#D6E4E8]">
                {filtered.map(att => (
                  <tr key={att.id} className="hover:bg-[#EAF2F4]/50">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar name={att.employeeName} size="sm" /><span className="text-sm font-medium text-[#263238]">{att.employeeName}</span></div></td>
                    <td className="px-6 py-4 text-sm text-gray-500">{att.date}</td>
                    <td className="px-6 py-4 text-sm text-[#263238]">{att.checkIn || '—'}</td>
                    <td className="px-6 py-4 text-sm text-[#263238]">{att.checkOut || '—'}</td>
                    <td className="px-6 py-4">{statusBadge(att.status)}</td>
                    <td className="px-6 py-4 text-sm text-[#263238]">{att.workHours}h</td>
                    <td className="px-6 py-4 text-sm text-[#263238]">{att.overtime > 0 ? `${att.overtime}h` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
