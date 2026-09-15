'use client';

import { useMemo, useState } from 'react';
import { mockAttendance, mockDashboardStats, mockEmployees } from '@/lib/mock-data';
import type { AttendanceRecord } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLeave } from '@/contexts/LeaveContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { timeToMinutes, toDateStr, todayStr } from '@/utils/date';
import type { CorrectionRequest, Holiday } from '../types';
import { aggregate, buildMonthlySchedule, calcWorkHours } from '../utils';

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

export type SummaryMode = 'daily' | 'weekly' | 'monthly';

export function useAttendance() {
  const { user } = useAuth();
  const { leaveRequests } = useLeave();
  const { addNotification } = useNotifications();
  const [holidayMsg, setHolidayMsg] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const stats = mockDashboardStats;

  // ---- Admin state: summary config ----
  const [activeTab, setActiveTab] = useState('daily');
  const [manualOpen, setManualOpen] = useState(false);
  const [viewDate, setViewDate] = useState(todayStr());
  const [summaryMode, setSummaryMode] = useState<SummaryMode>('daily');
  const [holidays, setHolidays] = useState<Holiday[]>(INITIAL_HOLIDAYS);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>(INITIAL_CORRECTIONS);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [confirmApproveCorrection, setConfirmApproveCorrection] = useState<CorrectionRequest | null>(null);
  const [confirmRejectCorrection, setConfirmRejectCorrection] = useState<CorrectionRequest | null>(null);
  const [confirmDeleteHoliday, setConfirmDeleteHoliday] = useState<Holiday | null>(null);
  const [logSearch, setLogSearch] = useState('');
  const [attendRecords, setAttendRecords] = useState<AttendanceRecord[]>(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const generated = mockEmployees.flatMap((emp) => buildMonthlySchedule(emp.id, `${emp.firstName} ${emp.lastName}`, year, month));
    return generated;
  });

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
      (a) => (empId ? a.employeeId === empId : a.employeeName.toLowerCase() === user.name.toLowerCase()) && a.date.startsWith(monthPrefix),
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
  const dayRecords = attendRecords.filter((r) => r.date === viewDate);

  const filteredDayRecords = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return dayRecords;
    return dayRecords.filter((r) => r.employeeName.toLowerCase().includes(q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendRecords, viewDate, logSearch]);

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
      return attendRecords.filter((r) => r.date >= from && r.date <= to);
    }
    const prefix = viewDate.slice(0, 7);
    return attendRecords.filter((r) => r.date.startsWith(prefix));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summaryMode, viewDate, attendRecords]);

  const pendingCorrections = corrections.filter((c) => c.status === 'Pending');

  const adminTabs = [
    { id: 'daily', label: 'Daily Log' },
    { id: 'summaries', label: 'Summaries' },
    { id: 'corrections', label: 'Corrections', count: pendingCorrections.length },
    { id: 'config', label: 'Holidays' },
  ];

  const agg = aggregate(summaryCounts);

  const summaryLabel =
    summaryMode === 'daily'
      ? `Daily Summary — ${viewDate}`
      : summaryMode === 'weekly'
        ? `Weekly Summary — Week of ${viewDate}`
        : `Monthly Summary — ${viewDate.slice(0, 7)}`;

  const handleAddManual = (values: { employeeId: string; date: string; checkIn: string; checkOut: string; status: string; notes: string }) => {
    const emp = mockEmployees.find((e) => e.id === values.employeeId);
    if (!emp) return;
    const record: AttendanceRecord = {
      id: `manual-${Date.now()}`,
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      date: values.date,
      checkIn: values.checkIn,
      checkOut: values.checkOut,
      status: values.status as AttendanceRecord['status'],
      workHours: calcWorkHours(values.checkIn, values.checkOut, values.status),
      overtime: 0,
      notes: values.notes || undefined,
    };
    setAttendRecords((current) => {
      const without = current.filter((r) => !(r.employeeId === emp.id && r.date === values.date));
      return [record, ...without];
    });
    setViewDate(values.date);
  };

  const handleUpdateRecord = (id: string, values: { checkIn: string; checkOut: string; status: string; notes: string }) => {
    setAttendRecords((current) =>
      current.map((r) =>
        r.id === id
          ? {
              ...r,
              checkIn: values.checkIn,
              checkOut: values.checkOut,
              status: values.status as AttendanceRecord['status'],
              workHours: calcWorkHours(values.checkIn, values.checkOut, values.status),
              notes: values.notes || undefined,
            }
          : r,
      ),
    );
    setEditingRecord(null);
  };

  const handleApproveCorrection = (id: string) => {
    setCorrections((current) =>
      current.map((c) => {
        if (c.id !== id) return c;
        if (c.status === 'Pending') {
          setAttendRecords((recs) =>
            recs.map((r) => {
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
            }),
          );
        }
        return { ...c, status: 'Approved' };
      }),
    );
  };

  const handleRejectCorrection = (id: string) => {
    setCorrections((current) => current.map((c) => (c.id === id ? { ...c, status: 'Rejected' } : c)));
  };

  const handleAddHoliday = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get('holidayName') || '').trim();
    const date = String(fd.get('holidayDate') || '');
    const type = String(fd.get('holidayType') || 'Public');
    if (!name || !date) return;
    setHolidays((current) => [...current, { id: `h-${Date.now()}`, name, date, type: type as Holiday['type'] }]);
    addNotification({
      title: 'New Holiday Announced',
      message: `${name} on ${date} (${type}) — notified to all ${mockEmployees.length} employees.`,
      type: 'info',
      link: '/attendance',
    });
    setHolidayMsg(`${name} on ${date} added — notification sent to all employees.`);
    e.currentTarget.reset();
  };

  return {
    user,
    stats,
    isEmployee,
    holidayMsg,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    activeTab,
    setActiveTab,
    manualOpen,
    setManualOpen,
    viewDate,
    setViewDate,
    summaryMode,
    setSummaryMode,
    holidays,
    setHolidays,
    corrections,
    setCorrections,
    editingRecord,
    setEditingRecord,
    confirmApproveCorrection,
    setConfirmApproveCorrection,
    confirmRejectCorrection,
    setConfirmRejectCorrection,
    confirmDeleteHoliday,
    setConfirmDeleteHoliday,
    logSearch,
    setLogSearch,
    attendRecords,
    monthLabel,
    monthlyRecords,
    presentDays,
    absentDays,
    lateDays,
    leavesTaken,
    dayRecords,
    filteredDayRecords,
    summaryCounts,
    pendingCorrections,
    adminTabs,
    agg,
    summaryLabel,
    handleAddManual,
    handleUpdateRecord,
    handleApproveCorrection,
    handleRejectCorrection,
    handleAddHoliday,
  };
}

export type UseAttendanceReturn = ReturnType<typeof useAttendance>;
