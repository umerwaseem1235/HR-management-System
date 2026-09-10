'use client';

import React, { useState, useMemo } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Tabs from '../../components/ui/Tabs';
import EmptyState from '../../components/ui/EmptyState';
import {
  UserCheck, UserX, Clock, CalendarDays, UserPlus, Plus, Check, X,
  Sun, Trash2, FileWarning, History, BadgeCheck,
} from 'lucide-react';
import { mockAttendance, mockDashboardStats, mockEmployees } from '../../lib/mock-data';
import { AttendanceRecord } from '../../lib/types';
import { useAuth } from '../../contexts/AuthContext';
import { useLeave } from '../../contexts/LeaveContext';

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'Present', label: 'Present' },
  { value: 'Absent', label: 'Absent' },
  { value: 'Late', label: 'Late' },
  { value: 'Half Day', label: 'Half Day' },
  { value: 'Leave', label: 'Leave' },
];

const ADMIN_STATUS_OPTIONS = [
  { value: 'Present', label: 'Present' },
  { value: 'Absent', label: 'Absent' },
  { value: 'Late', label: 'Late' },
  { value: 'Half Day', label: 'Half Day' },
  { value: 'Leave', label: 'Leave' },
  { value: 'Holiday', label: 'Holiday' },
  { value: 'Weekend', label: 'Weekend' },
];

interface CorrectionRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  currentStatus: string;
  requestedStatus: string;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'Public' | 'Optional' | 'Company';
}

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function timeToMinutes(t: string): number {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function minutesToHrs(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

function todayStr() {
  return toDateStr(new Date());
}

const INITIAL_CORRECTIONS: CorrectionRequest[] = [
  { id: 'c1', employeeId: '9', employeeName: 'Ahmed Hassan', date: todayStr(), currentStatus: 'Absent', requestedStatus: 'Present', requestedCheckIn: '09:05', requestedCheckOut: '18:00', reason: 'Biometric device not working, forgot to mark attendance', status: 'Pending' },
  { id: 'c2', employeeId: '3', employeeName: 'David Kim', date: todayStr(), currentStatus: 'Absent', requestedStatus: 'Late', requestedCheckIn: '10:15', requestedCheckOut: '18:30', reason: 'Morning flight delay', status: 'Pending' },
  { id: 'c3', employeeId: '6', employeeName: 'Priya Sharma', date: todayStr(), currentStatus: 'Late', requestedStatus: 'Present', reason: 'Marked late due to badge reader error', status: 'Pending' },
];

const INITIAL_HOLIDAYS: Holiday[] = [
  { id: 'h1', name: "New Year's Day", date: '2026-01-01', type: 'Public' },
  { id: 'h2', name: 'Republic Day', date: '2026-01-26', type: 'Public' },
  { id: 'h3', name: 'Independence Day', date: '2026-08-15', type: 'Public' },
  { id: 'h4', name: 'Diwali', date: '2026-11-08', type: 'Company' },
  { id: 'h5', name: 'Christmas', date: '2026-12-25', type: 'Public' },
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

export default function AttendancePage() {
  const { user } = useAuth();
  const { leaveRequests } = useLeave();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const stats = mockDashboardStats;

  // ---- Admin state: summary config ----
  const [activeTab, setActiveTab] = useState('daily');
  const [manualOpen, setManualOpen] = useState(false);
  const [viewDate, setViewDate] = useState(todayStr());
  const [summaryMode, setSummaryMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [holidays, setHolidays] = useState<Holiday[]>(INITIAL_HOLIDAYS);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>(INITIAL_CORRECTIONS);
  const [attendRecords, setAttendRecords] = useState<AttendanceRecord[]>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const generated = mockEmployees.flatMap(emp => buildMonthlySchedule(emp.id, `${emp.firstName} ${emp.lastName}`, year, month));
    return generated;
  });

  // ---- Admin derived state ----
  // Standard company schedule used for late arrival / early departure
  // tracking now that per-shift configuration has been removed.
  const STANDARD_START = '09:00';
  const STANDARD_END = '18:00';
  const STANDARD_GRACE_MINUTES = 15;

  const lateBy = (rec: AttendanceRecord): number => {
    if (!rec.checkIn) return 0;
    const diff = timeToMinutes(rec.checkIn) - (timeToMinutes(STANDARD_START) + STANDARD_GRACE_MINUTES);
    return diff > 0 ? diff : 0;
  };

  const earlyLeave = (rec: AttendanceRecord): number => {
    if (!rec.checkIn || !rec.checkOut) return 0;
    const diff = timeToMinutes(STANDARD_END) - timeToMinutes(rec.checkOut);
    return diff > 0 ? diff : 0;
  };

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

    const realMonthly = mockAttendance.filter(
      (a) => (empId ? a.employeeId === empId : a.employeeName.toLowerCase() === user.name.toLowerCase()) && a.date.startsWith(monthPrefix)
    );
    const realDates = new Set(realMonthly.map((r) => r.date));

    const generated = empId
      ? buildMonthlySchedule(empId, empName, year, month).filter((r) => !realDates.has(r.date))
      : [];

    const monthlyRecords = [...realMonthly, ...generated].sort((a, b) => (a.date < b.date ? 1 : -1));

    const presentDays = monthlyRecords.filter((r) => r.status === 'Present').length;
    const absentDays = monthlyRecords.filter((r) => r.status === 'Absent').length;
    const lateDays = monthlyRecords.filter((r) => r.status === 'Late').length;
    const attendanceLeaveDates = new Set(monthlyRecords.filter((r) => r.status === 'Leave').map((r) => r.date));

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    let approvedLeaveDays = 0;
    leaveRequests
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
  }, [user, isEmployee, employee, leaveRequests]);

  // ---- Hoisted above all early returns (Rules of Hooks): every hook must
  // ---- run unconditionally on every render, regardless of role/login state.
  const dayRecords = attendRecords.filter(r => r.date === viewDate);

  const summaryCounts = useMemo(() => {
    if (summaryMode === 'daily') {
      return dayRecords;
    }
    if (summaryMode === 'weekly') {
      const anchor = new Date(viewDate);
      const day = anchor.getDay();
      const diff = anchor.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(anchor.setDate(diff));
      const sun = new Date(mon);
      sun.setDate(mon.getDate() + 6);
      const from = toDateStr(mon);
      const to = toDateStr(sun);
      return attendRecords.filter(r => r.date >= from && r.date <= to);
    }
    const prefix = viewDate.slice(0, 7);
    return attendRecords.filter(r => r.date.startsWith(prefix));
  }, [summaryMode, viewDate, dayRecords, attendRecords]);

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
          <PageHeader
            eyebrow="Time Tracking"
            title="My Attendance"
            subtitle={monthLabel}
          />

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

  // ============================================================
  //              SUPER ADMIN / HR VIEW (professional)
  // ============================================================

  const pendingCorrections = corrections.filter(c => c.status === 'Pending');

  const adminTabs = [
    { id: 'daily', label: 'Daily Log' },
    { id: 'summaries', label: 'Summaries' },
    { id: 'corrections', label: 'Corrections', count: pendingCorrections.length },
    { id: 'config', label: 'Holidays' },
  ];

  const aggregate = (records: AttendanceRecord[]) => {
    const present = records.filter(r => r.status === 'Present').length;
    const absent = records.filter(r => r.status === 'Absent').length;
    const late = records.filter(r => r.status === 'Late').length;
    const halfDay = records.filter(r => r.status === 'Half Day').length;
    const leave = records.filter(r => r.status === 'Leave').length;
    const totalHours = records.reduce((s, r) => s + (r.workHours || 0), 0);
    return { present, absent, late, halfDay, leave, totalHours };
  };

  const agg = aggregate(summaryCounts);

  const summaryLabel =
    summaryMode === 'daily'
      ? `Daily Summary — ${viewDate}`
      : summaryMode === 'weekly'
        ? `Weekly Summary — Week of ${viewDate}`
        : `Monthly Summary — ${viewDate.slice(0, 7)}`;

  const handleAddManual = (values: { employeeId: string; date: string; checkIn: string; checkOut: string; status: string; notes: string }) => {
    const emp = mockEmployees.find(e => e.id === values.employeeId);
    if (!emp) return;
    const inMin = values.checkIn ? timeToMinutes(values.checkIn) : 0;
    const outMin = values.checkOut ? timeToMinutes(values.checkOut) : 0;
    let workHours = 0;
    if (inMin && outMin && outMin > inMin) workHours = Math.round((((outMin - inMin) / 60)) * 10) / 10;
    else if (values.status === 'Present' || values.status === 'Late') workHours = 8;
    else if (values.status === 'Half Day') workHours = 4;

    const record: AttendanceRecord = {
      id: `manual-${Date.now()}`,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      date: values.date,
      checkIn: values.checkIn,
      checkOut: values.checkOut,
      status: values.status as AttendanceRecord['status'],
      workHours,
      overtime: 0,
      notes: values.notes || undefined,
    };
    setAttendRecords(current => {
      const without = current.filter(r => !(r.employeeId === emp.id && r.date === values.date));
      return [record, ...without];
    });
    setViewDate(values.date);
  };

  const handleApproveCorrection = (id: string) => {
    setCorrections(current => current.map(c => {
      if (c.id !== id) return c;
      if (c.status === 'Pending') {
        setAttendRecords(recs => recs.map(r => {
          if (r.employeeId === c.employeeId && r.date === c.date) {
            const updated: AttendanceRecord = {
              ...r,
              status: c.requestedStatus as AttendanceRecord['status'],
              checkIn: c.requestedCheckIn ?? r.checkIn,
              checkOut: c.requestedCheckOut ?? r.checkOut,
            };
            const inMin = updated.checkIn ? timeToMinutes(updated.checkIn) : 0;
            const outMin = updated.checkOut ? timeToMinutes(updated.checkOut) : 0;
            if (inMin && outMin && outMin > inMin) updated.workHours = Math.round((outMin - inMin) / 60 * 10) / 10;
            else if (updated.status === 'Present' || updated.status === 'Late') updated.workHours = 8;
            else if (updated.status === 'Half Day') updated.workHours = 4;
            return updated;
          }
          return r;
        }));
      }
      return { ...c, status: 'Approved' };
    }));
  };

  const handleRejectCorrection = (id: string) => {
    setCorrections(current => current.map(c => c.id === id ? { ...c, status: 'Rejected' } : c));
  };

  const handleAddHoliday = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('holidayName') || '');
    const date = String(fd.get('holidayDate') || '');
    const type = String(fd.get('holidayType') || 'Public');
    if (!name || !date) return;
    setHolidays(current => [...current, { id: `h-${Date.now()}`, name, date, type: type as Holiday['type'] }]);
    e.currentTarget.reset();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Time Tracking"
          title="Attendance"
          subtitle="Monitor attendance across the organization"
          actions={
            <>
              <Badge variant="success">{stats.presentToday} Present</Badge>
              <Badge variant="danger">{stats.absentToday} Absent</Badge>
              <Badge variant="warning">{stats.lateToday} Late</Badge>
              <Badge variant="info">{stats.onLeaveToday} On Leave</Badge>
            </>
          }
        />

        {/* Today snapshot */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Present" value={stats.presentToday} icon={<UserCheck size={22} className="text-green-600" />} iconBg="bg-green-50" change="Today" />
          <StatCard title="Absent" value={stats.absentToday} icon={<UserX size={22} className="text-red-500" />} iconBg="bg-red-50" change="Today" />
          <StatCard title="Late" value={stats.lateToday} icon={<Clock size={22} className="text-orange-500" />} iconBg="bg-orange-50" change="Today" />
          <StatCard title="On Leave" value={stats.onLeaveToday} icon={<CalendarDays size={22} className="text-blue-500" />} iconBg="bg-blue-50" change="Today" />
        </div>

        <Card padding="none">
          <div className="px-6 pt-4">
            <Tabs tabs={adminTabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>
        </Card>

        {/* ---------------- DAILY LOG ---------------- */}
        {activeTab === 'daily' && (
          <>
            <Card padding="sm">
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="date"
                  label="Date"
                  value={viewDate}
                  onChange={(e) => setViewDate(e.target.value)}
                  className="sm:max-w-[200px]"
                />
                <div className="sm:ml-auto">
                  <Button variant="primary" onClick={() => setViewDate(todayStr())}>
                    <CalendarDays size={16} /> Today
                  </Button>
                </div>
                <div>
                  <Button variant="secondary" onClick={() => setManualOpen(true)}>
                    <UserPlus size={16} /> Manual Entry
                  </Button>
                </div>
              </div>
            </Card>

            <Card padding="none">
              <div className="px-6 py-4 border-b border-[#D6E4E8] flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#17324D]">Attendance Log — {viewDate}</h3>
                <Badge variant="default">{dayRecords.length} employees</Badge>
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
                    {dayRecords.map(att => {
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
                          <td className="px-6 py-4">{statusBadge(att.status)}</td>
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
              {dayRecords.length === 0 && (
                <div className="p-6">
                  <EmptyState title="No records for this date" description={`No attendance records found for ${viewDate}. Use Manual Entry to add one.`} />
                </div>
              )}
            </Card>
          </>
        )}

        {/* ---------------- SUMMARIES ---------------- */}
        {activeTab === 'summaries' && (
          <>
            <Card padding="sm">
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant={summaryMode === 'daily' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSummaryMode('daily')}
                  >
                    Daily
                  </Button>
                  <Button
                    variant={summaryMode === 'weekly' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSummaryMode('weekly')}
                  >
                    Weekly
                  </Button>
                  <Button
                    variant={summaryMode === 'monthly' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setSummaryMode('monthly')}
                  >
                    Monthly
                  </Button>
                </div>
                <div className="lg:ml-auto lg:w-56">
                  <Input
                    type={summaryMode === 'monthly' ? 'month' : 'date'}
                    label="Period"
                    value={viewDate}
                    onChange={(e) => setViewDate(e.target.value)}
                  />
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard title="Present" value={agg.present} icon={<UserCheck size={22} className="text-green-600" />} iconBg="bg-green-50" change="employees" />
              <StatCard title="Absent" value={agg.absent} icon={<UserX size={22} className="text-red-500" />} iconBg="bg-red-50" change="employees" />
              <StatCard title="Late" value={agg.late} icon={<Clock size={22} className="text-orange-500" />} iconBg="bg-orange-50" change="employees" />
              <StatCard title="Half Day" value={agg.halfDay} icon={<Sun size={22} className="text-yellow-500" />} iconBg="bg-yellow-50" change="employees" />
              <StatCard title="On Leave" value={agg.leave} icon={<CalendarDays size={22} className="text-blue-500" />} iconBg="bg-blue-50" change="employees" />
            </div>

            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h3 className="text-base font-semibold text-[#17324D]">{summaryLabel}</h3>
                <div className="flex gap-2">
                  <Badge variant="default">{agg.totalHours.toFixed(1)}h Work Hours</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[
                  { label: 'Present', pct: agg.present ? Math.round((agg.present / Math.max(1, summaryCounts.length)) * 100) : 0, color: 'bg-green-500' },
                  { label: 'Absent', pct: agg.absent ? Math.round((agg.absent / Math.max(1, summaryCounts.length)) * 100) : 0, color: 'bg-red-500' },
                  { label: 'Late', pct: agg.late ? Math.round((agg.late / Math.max(1, summaryCounts.length)) * 100) : 0, color: 'bg-orange-500' },
                  { label: 'Half Day', pct: agg.halfDay ? Math.round((agg.halfDay / Math.max(1, summaryCounts.length)) * 100) : 0, color: 'bg-yellow-500' },
                  { label: 'Leave', pct: agg.leave ? Math.round((agg.leave / Math.max(1, summaryCounts.length)) * 100) : 0, color: 'bg-blue-500' },
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
                    {Array.from(new Set(summaryCounts.map(r => r.date))).sort().reverse().map(date => {
                      const dayRecs = summaryCounts.filter(r => r.date === date);
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
                {summaryCounts.length === 0 && (
                  <div className="p-6">
                    <EmptyState title="No records in this period" description="Try a different period or date range." />
                  </div>
                )}
              </div>
            </Card>
          </>
        )}

        {/* ---------------- CORRECTIONS ---------------- */}
        {activeTab === 'corrections' && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileWarning size={18} className="text-yellow-600" />
                    <h3 className="text-base font-semibold text-[#17324D]">Correction Requests</h3>
                  </div>
                  <Badge variant="warning">{pendingCorrections.length} Pending</Badge>
                </div>
                <div className="space-y-3">
                  {pendingCorrections.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-10">No pending correction requests</p>
                  ) : (
                    pendingCorrections.map(req => (
                      <div key={req.id} className="rounded-lg border border-[#D6E4E8] bg-[#F8FBFC] p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={req.employeeName} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-[#263238]">{req.employeeName}</p>
                              <p className="text-xs text-gray-500">{req.date}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            {statusBadge(req.currentStatus)}
                            <span className="text-gray-400">→</span>
                            {statusBadge(req.requestedStatus)}
                          </div>
                        </div>
                        {(req.requestedCheckIn || req.requestedCheckOut) && (
                          <p className="text-xs text-gray-500 mt-2">
                            Requested: {req.requestedCheckIn ? `In ${req.requestedCheckIn}` : ''}{req.requestedCheckOut ? ` · Out ${req.requestedCheckOut}` : ''}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{req.reason}</p>
                        <div className="flex items-center justify-end gap-2 mt-3">
                          <button
                            onClick={() => handleRejectCorrection(req.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#D6E4E8] px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <X size={14} /> Reject
                          </button>
                          <button
                            onClick={() => handleApproveCorrection(req.id)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                          >
                            <BadgeCheck size={14} /> Approve
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <History size={18} className="text-[#17324D]" />
                    <h3 className="text-base font-semibold text-[#17324D]">Request History</h3>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Change</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D6E4E8]">
                      {corrections.map(req => (
                        <tr key={req.id} className="hover:bg-[#EAF2F4]/50">
                          <td className="px-4 py-3 text-sm font-medium text-[#263238]">{req.employeeName}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{req.date}</td>
                          <td className="px-4 py-3 text-sm text-[#263238]">{req.currentStatus} → {req.requestedStatus}</td>
                          <td className="px-4 py-3">
                            <Badge variant={req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'danger' : 'warning'}>{req.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* ---------------- CONFIG ---------------- */}
        {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Holiday configuration */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarDays size={18} className="text-[#0F8B8D]" />
                  <h3 className="text-base font-semibold text-[#17324D]">Holiday Configuration</h3>
                </div>
                <Badge variant="default">{holidays.length} Holidays</Badge>
              </div>

              <form onSubmit={handleAddHoliday} className="mb-4 rounded-lg border border-dashed border-[#D6E4E8] bg-[#F8FBFC] p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input name="holidayName" label="Holiday Name" placeholder="e.g. Independence Day" required />
                  <Input name="holidayDate" label="Date" type="date" required />
                  <Select
                    name="holidayType"
                    label="Type"
                    defaultValue="Public"
                    options={[
                      { value: 'Public', label: 'Public' },
                      { value: 'Optional', label: 'Optional' },
                      { value: 'Company', label: 'Company' },
                    ]}
                  />
                </div>
                <Button type="submit" size="sm" className="mt-3">
                  <Plus size={15} /> Add Holiday
                </Button>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Holiday</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D6E4E8]">
                    {holidays.map(h => (
                      <tr key={h.id} className="hover:bg-[#EAF2F4]/50">
                        <td className="px-4 py-3 text-sm font-medium text-[#263238]">{h.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{h.date}</td>
                        <td className="px-4 py-3">
                          <Badge variant={h.type === 'Public' ? 'info' : h.type === 'Company' ? 'success' : 'neutral'}>{h.type}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setHolidays(current => current.filter(x => x.id !== h.id))}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* Manual attendance entry modal */}
        <ManualEntryModal
          open={manualOpen}
          onClose={() => setManualOpen(false)}
          onSave={handleAddManual}
        />
      </div>
    </DashboardLayout>
  );
}

function ManualEntryModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (values: { employeeId: string; date: string; checkIn: string; checkOut: string; status: string; notes: string }) => void;
}) {
  const [selectedEmp, setSelectedEmp] = useState('');
  const [date, setDate] = useState(todayStr());
  const [checkIn, setCheckIn] = useState('09:00');
  const [checkOut, setCheckOut] = useState('18:00');
  const [status, setStatus] = useState('Present');
  const [notes, setNotes] = useState('');

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmp || !date) return;
    onSave({ employeeId: selectedEmp, date, checkIn, checkOut, status, notes });
    setSelectedEmp('');
    setCheckIn('09:00');
    setCheckOut('18:00');
    setStatus('Present');
    setNotes('');
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Authorized Manual Attendance Entry" size="lg">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Select
              label="Employee"
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
              options={[{ value: '', label: 'Select employee...' }, ...mockEmployees.map(e => ({ value: e.id, label: `${e.firstName} ${e.lastName} (${e.employeeCode})` }))]}
              required
            />
          </div>
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={ADMIN_STATUS_OPTIONS}
            required
          />
          <Input label="Check In" type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          <Input label="Check Out" type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Notes" placeholder="Reason for manual entry (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-[#D6E4E8]">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit"><UserPlus size={16} /> Save Entry</Button>
        </div>
      </form>
    </Modal>
  );
}