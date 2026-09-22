'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import type { AttendanceRecord, Employee } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLeave } from '@/contexts/LeaveContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { timeToMinutes, toDateStr, todayStr } from '@/utils/date';
import type { CorrectionHistoryEntry, CorrectionRequest, Holiday } from '../types';
import { aggregate, calcWorkHours } from '../utils';
import { createAuditLog, getAuditLogsByModule } from '@/lib/actions/audit';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function summarizeAttendance(status?: string, checkIn?: string, checkOut?: string): string {
  return `Status: ${status || '—'} · In: ${checkIn || '—'} · Out: ${checkOut || '—'}`;
}

// audit_logs.record convention for attendance: "Employee Name|YYYY-MM-DD"
function mapAuditToHistory(logs: { id: string; userName: string; action: string; record: string; previousValue?: string; newValue?: string; timestamp: string }[]): CorrectionHistoryEntry[] {
  return logs.map((l) => {
    const sep = l.record.lastIndexOf('|');
    const employeeName = sep >= 0 ? l.record.slice(0, sep) : l.record;
    const date = sep >= 0 ? l.record.slice(sep + 1) : '';
    return {
      id: l.id,
      correctedBy: l.userName || 'Unknown',
      employeeName,
      date,
      action: (l.action === 'Correction Approved' ? 'Correction Approved' : 'Manual Correction') as CorrectionHistoryEntry['action'],
      previousValue: l.previousValue || '—',
      newValue: l.newValue || '—',
      timestamp: l.timestamp,
    };
  });
}

// ── Supabase server actions ──────────────────────────────────────────
import {
  getAllAttendance,
  getAttendanceByDate,
  getAttendanceByEmployee,
  getAttendanceStats,
  createAttendanceRecord,
  updateAttendanceRecord,
  getCorrections,
  updateCorrectionStatus,
  getHolidays,
  createHoliday,
  deleteHoliday,
  deleteAttendanceRecord,
  selfCheckInOut,
} from '@/lib/actions/attendance';
import { getEmployees } from '@/lib/actions/employees';

export type SummaryMode = 'daily' | 'weekly' | 'monthly';

export interface TodayStats {
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
}

export function useAttendance() {
  const { user } = useAuth();
  const { leaveRequests } = useLeave();
  const { addNotification } = useNotifications();

  // ── Loading / error state ──────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Core data (from Supabase) ──────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendRecords, setAttendRecords] = useState<AttendanceRecord[]>([]);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [correctionHistory, setCorrectionHistory] = useState<CorrectionHistoryEntry[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [todayStatsData, setTodayStatsData] = useState<TodayStats>({
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    onLeaveToday: 0,
  });

  // ── UI state ───────────────────────────────────────────────────────
  const [holidayMsg, setHolidayMsg] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab] = useState('daily');
  const [manualOpen, setManualOpen] = useState(false);
  const [viewDate, setViewDate] = useState(todayStr());
  const [summaryMode, setSummaryMode] = useState<SummaryMode>('daily');
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [confirmApproveCorrection, setConfirmApproveCorrection] = useState<CorrectionRequest | null>(null);
  const [confirmRejectCorrection, setConfirmRejectCorrection] = useState<CorrectionRequest | null>(null);
  const [confirmDeleteHoliday, setConfirmDeleteHoliday] = useState<Holiday | null>(null);
  const [logSearch, setLogSearch] = useState('');

  const isEmployee = user?.role === 'employee';

  // ── Expose stats (live from Supabase) ──────────────────────────────
  const stats = todayStatsData;

  // ── Initial data load ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 1-indexed for server action

        const [empData, attData, corrData, histData, holData, statsData] =
          await Promise.all([
            getEmployees(),
            getAllAttendance(year, month),
            getCorrections(),
            getAuditLogsByModule('Attendance'),
            getHolidays(),
            getAttendanceStats(),
          ]);
        if (cancelled) return;
        setEmployees(empData);
        setAttendRecords(attData);
        setCorrections(corrData);
        setCorrectionHistory(mapAuditToHistory(histData));
        setHolidays(holData);
        setTodayStatsData(statsData);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Failed to load attendance data:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  // ── Re-fetch day records when viewDate changes ─────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadDayRecords() {
      try {
        const dayData = await getAttendanceByDate(viewDate);
        if (cancelled) return;
        // Merge day records into attendRecords — replace records for this date
        setAttendRecords((prev) => {
          const otherDates = prev.filter((r) => r.date !== viewDate);
          return [...otherDates, ...dayData];
        });
      } catch (err: any) {
        console.error('Failed to load day records:', err);
      }
    }
    loadDayRecords();
    return () => { cancelled = true; };
  }, [viewDate]);

  // ── Employee resolution ────────────────────────────────────────────
  const employee = useMemo(() => {
    if (!user) return undefined;
    return (
      employees.find(
        (e) => e.email.toLowerCase() === user.email.toLowerCase(),
      ) ||
      employees.find(
        (e) =>
          `${e.firstName} ${e.lastName}`.toLowerCase() ===
          user.name.toLowerCase(),
      )
    );
  }, [user, employees]);

  // ── Employee monthly stats ─────────────────────────────────────────
  const {
    monthLabel,
    monthlyRecords,
    presentDays,
    absentDays,
    lateDays,
    leavesTaken,
  } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const monthLabel = now.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
    const empty = {
      monthLabel,
      monthlyRecords: [] as AttendanceRecord[],
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      leavesTaken: 0,
    };
    if (!user || !isEmployee) return empty;

    const empId = employee?.id ?? '';
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    // Filter real DB records for this employee + month
    const monthlyRecords = attendRecords
      .filter(
        (a) =>
          (empId
            ? a.employeeId === empId
            : a.employeeName.toLowerCase() === user.name.toLowerCase()) &&
          a.date.startsWith(monthPrefix),
      )
      .sort((a, b) => (a.date < b.date ? 1 : -1));

    const presentDays = monthlyRecords.filter(
      (r) => r.status === 'Present',
    ).length;
    const absentDays = monthlyRecords.filter(
      (r) => r.status === 'Absent',
    ).length;
    const lateDays = monthlyRecords.filter(
      (r) => r.status === 'Late',
    ).length;
    const attendanceLeaveDates = new Set(
      monthlyRecords.filter((r) => r.status === 'Leave').map((r) => r.date),
    );

    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    let approvedLeaveDays = 0;
    leaveRequests
      .filter(
        (l) =>
          (empId
            ? l.employeeId === empId
            : l.employeeName.toLowerCase() === user.name.toLowerCase()) &&
          l.status === 'Approved',
      )
      .forEach((l) => {
        const start = new Date(l.startDate);
        const end = new Date(l.endDate);
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
        const overlapStart = start > monthStart ? start : monthStart;
        const overlapEnd = end < monthEnd ? end : monthEnd;
        for (
          let d = new Date(overlapStart);
          d <= overlapEnd;
          d.setDate(d.getDate() + 1)
        ) {
          const ds = toDateStr(d);
          if (!attendanceLeaveDates.has(ds)) approvedLeaveDays++;
        }
      });

    return {
      monthLabel,
      monthlyRecords,
      presentDays,
      absentDays,
      lateDays,
      leavesTaken: attendanceLeaveDates.size + approvedLeaveDays,
    };
  }, [user, isEmployee, employee, leaveRequests, attendRecords]);

  // ── Admin: daily records for selected date ─────────────────────────
  const dayRecords = attendRecords.filter((r) => r.date === viewDate);

  const filteredDayRecords = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return dayRecords;
    return dayRecords.filter((r) =>
      r.employeeName.toLowerCase().includes(q),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attendRecords, viewDate, logSearch]);

  // ── Admin: summaries ───────────────────────────────────────────────
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

  const pendingCorrections = corrections.filter(
    (c) => c.status === 'Pending',
  );

  const adminTabs = [
    { id: 'daily', label: 'Daily Log' },
    { id: 'summaries', label: 'Summaries' },
    {
      id: 'corrections',
      label: 'Corrections',
      count: pendingCorrections.length,
    },
    { id: 'config', label: 'Holidays' },
  ];

  const agg = aggregate(summaryCounts);

  const summaryLabel =
    summaryMode === 'daily'
      ? `Daily Summary — ${viewDate}`
      : summaryMode === 'weekly'
        ? `Weekly Summary — Week of ${viewDate}`
        : `Monthly Summary — ${viewDate.slice(0, 7)}`;

  // ── Refresh helper ─────────────────────────────────────────────────
  const refreshStats = useCallback(async () => {
    try {
      const statsData = await getAttendanceStats();
      setTodayStatsData(statsData);
    } catch { /* ignore */ }
  }, []);

  const refreshCorrectionHistory = useCallback(async () => {
    try {
      const histData = await getAuditLogsByModule('Attendance');
      setCorrectionHistory(mapAuditToHistory(histData));
    } catch { /* ignore */ }
  }, []);

  // Log an HR attendance correction to the audit trail (Correction History).
  // userId is only stored when it is a real Supabase auth UUID; mock/demo
  // logins keep user_id NULL so the insert never violates the FK type.
  const logCorrection = useCallback(
    async (action: 'Manual Correction' | 'Correction Approved', employeeName: string, date: string, previousValue: string, newValue: string) => {
      try {
        const rawId = user?.id;
        await createAuditLog({
          userId: rawId && UUID_RE.test(rawId) ? rawId : undefined,
          userName: user?.name || 'Unknown',
          module: 'Attendance',
          action,
          record: `${employeeName}|${date}`,
          previousValue,
          newValue,
        });
        await refreshCorrectionHistory();
      } catch (err) {
        console.error('Failed to log correction history:', err);
      }
    },
    [user, refreshCorrectionHistory],
  );

  // ── Employee Self Check-In / Check-Out ──────────────────────────────────
  const handleSelfCheckIn = useCallback(async () => {
    if (!employee?.id) return;
    try {
      const newRecord = await selfCheckInOut(employee.id, todayStr(), 'check_in');
      // Update local state
      setAttendRecords((current) => {
        const without = current.filter((r) => !(r.employeeId === employee.id && r.date === todayStr()));
        return [newRecord, ...without];
      });
      await refreshStats();
    } catch (err: any) {
      console.error('Failed to check in:', err);
      setError(err.message || 'Failed to check in');
    }
  }, [employee, refreshStats]);

  const handleSelfCheckOut = useCallback(async () => {
    if (!employee?.id) return;
    try {
      const newRecord = await selfCheckInOut(employee.id, todayStr(), 'check_out');
      setAttendRecords((current) => {
        const without = current.filter((r) => !(r.employeeId === employee.id && r.date === todayStr()));
        return [newRecord, ...without];
      });
      await refreshStats();
    } catch (err: any) {
      console.error('Failed to check out:', err);
      setError(err.message || 'Failed to check out');
    }
  }, [employee, refreshStats]);

  // ── Manual entry (Supabase) ────────────────────────────────────────
  const handleAddManual = useCallback(
    async (values: {
      employeeId: string;
      date: string;
      checkIn: string;
      checkOut: string;
      status: string;
      notes: string;
    }) => {
      const emp = employees.find((e) => e.id === values.employeeId);
      if (!emp) return;

      const workHours = calcWorkHours(
        values.checkIn,
        values.checkOut,
        values.status,
      );

      try {
        const newRecord = await createAttendanceRecord({
          employeeId: emp.id,
          date: values.date,
          checkIn: values.checkIn,
          checkOut: values.checkOut,
          status: values.status as AttendanceRecord['status'],
          workHours,
          overtime: 0,
          notes: values.notes || undefined,
        });
        setAttendRecords((current) => {
          const without = current.filter(
            (r) => !(r.employeeId === emp.id && r.date === values.date),
          );
          return [newRecord, ...without];
        });
        setViewDate(values.date);
        setManualOpen(false);
        await refreshStats();
      } catch (err: any) {
        console.error('Failed to add manual record:', err);
        setError(err.message || 'Failed to save attendance record');
      }
    },
    [employees, refreshStats],
  );

  // ── Edit record (Supabase) ─────────────────────────────────────────
  const handleUpdateRecord = useCallback(
    async (
      id: string,
      values: {
        checkIn: string;
        checkOut: string;
        status: string;
        notes: string;
      },
    ) => {
      const workHours = calcWorkHours(
        values.checkIn,
        values.checkOut,
        values.status,
      );
      // Capture the pre-edit snapshot for the correction-history audit trail
      const before = attendRecords.find((r) => r.id === id);
      try {
        await updateAttendanceRecord(id, {
          checkIn: values.checkIn,
          checkOut: values.checkOut,
          status: values.status,
          workHours,
          notes: values.notes,
        });
        setAttendRecords((current) =>
          current.map((r) =>
            r.id === id
              ? {
                  ...r,
                  checkIn: values.checkIn,
                  checkOut: values.checkOut,
                  status: values.status as AttendanceRecord['status'],
                  workHours,
                  notes: values.notes || undefined,
                }
              : r,
          ),
        );
        setEditingRecord(null);
        await refreshStats();
        if (before) {
          await logCorrection(
            'Manual Correction',
            before.employeeName,
            before.date,
            summarizeAttendance(before.status, before.checkIn, before.checkOut),
            summarizeAttendance(values.status, values.checkIn, values.checkOut),
          );
        }
      } catch (err: any) {
        console.error('Failed to update record:', err);
        setError(err.message || 'Failed to update attendance record');
      }
    },
    [attendRecords, logCorrection, refreshStats],
  );

  // ── Delete record (Supabase) ─────────────────────────────────────────
  const handleDeleteRecord = useCallback(
    async (id: string) => {
      try {
        await deleteAttendanceRecord(id);
        setAttendRecords((current) => current.filter((r) => r.id !== id));
        setEditingRecord(null);
        await refreshStats();
      } catch (err: any) {
        console.error('Failed to delete attendance record:', err);
        setError(err.message || 'Failed to delete attendance record');
      }
    },
    [refreshStats],
  );

  // ── Approve correction (Supabase) ──────────────────────────────────
  const handleApproveCorrection = useCallback(
    async (id: string) => {
      const target = corrections.find((c) => c.id === id);
      try {
        await updateCorrectionStatus(id, 'Approved');
        // Update local state optimistically
        setCorrections((current) =>
          current.map((c) => {
            if (c.id !== id) return c;
            if (c.status === 'Pending') {
              setAttendRecords((recs) =>
                recs.map((r) => {
                  if (r.employeeId === c.employeeId && r.date === c.date) {
                    const updated: AttendanceRecord = {
                      ...r,
                      status:
                        c.requestedStatus as AttendanceRecord['status'],
                      checkIn: c.requestedCheckIn ?? r.checkIn,
                      checkOut: c.requestedCheckOut ?? r.checkOut,
                    };
                    const inMin = updated.checkIn
                      ? timeToMinutes(updated.checkIn)
                      : 0;
                    const outMin = updated.checkOut
                      ? timeToMinutes(updated.checkOut)
                      : 0;
                    if (inMin && outMin && outMin > inMin)
                      updated.workHours =
                        Math.round(((outMin - inMin) / 60) * 10) / 10;
                    else if (
                      updated.status === 'Present' ||
                      updated.status === 'Late'
                    )
                      updated.workHours = 8;
                    else if (updated.status === 'Half Day')
                      updated.workHours = 4;
                    return updated;
                  }
                  return r;
                }),
              );
            }
            return { ...c, status: 'Approved' as const };
          }),
        );
        await refreshStats();
        if (target) {
          const times = [target.requestedCheckIn ? `In ${target.requestedCheckIn}` : '', target.requestedCheckOut ? `Out ${target.requestedCheckOut}` : '']
            .filter(Boolean)
            .join(' · ');
          await logCorrection(
            'Correction Approved',
            target.employeeName,
            target.date,
            `Status: ${target.currentStatus}`,
            `Status: ${target.requestedStatus}${times ? ` (${times})` : ''}`,
          );
        }
      } catch (err: any) {
        console.error('Failed to approve correction:', err);
        setError(err.message || 'Failed to approve correction');
      }
    },
    [corrections, logCorrection, refreshStats],
  );

  // ── Reject correction (Supabase) ───────────────────────────────────
  const handleRejectCorrection = useCallback(async (id: string) => {
    try {
      await updateCorrectionStatus(id, 'Rejected');
      setCorrections((current) =>
        current.map((c) =>
          c.id === id ? { ...c, status: 'Rejected' as const } : c,
        ),
      );
    } catch (err: any) {
      console.error('Failed to reject correction:', err);
      setError(err.message || 'Failed to reject correction');
    }
  }, []);

  // ── Add holiday (Supabase) ─────────────────────────────────────────
  const handleAddHoliday = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      // Capture the form element synchronously — React nullifies
      // e.currentTarget after awaits, which crashed .reset().
      const form = e.currentTarget;
      const fd = new FormData(form);
      const name = String(fd.get('holidayName') || '').trim();
      const date = String(fd.get('holidayDate') || '');
      const type = String(fd.get('holidayType') || 'Public');
      const isRecurring = fd.get('holidayRecurring') === 'on';
      if (!name || !date) return;

      try {
        const newHoliday = await createHoliday({
          name,
          date,
          type,
          isRecurring,
        });
        setHolidays((current) => [...current, newHoliday]);
        addNotification({
          title: 'New Holiday Announced',
          message: `${name} on ${date} (${type}) — notified to all employees.`,
          type: 'info',
          link: '/attendance',
        });
        setHolidayMsg(
          `${name} on ${date} added — notification sent to all employees.`,
        );
        form.reset();
      } catch (err: any) {
        console.error('Failed to add holiday:', err);
        setError(err.message || 'Failed to add holiday');
      }
    },
    [addNotification],
  );

  // ── Delete holiday (Supabase) ──────────────────────────────────────
  const handleDeleteHoliday = useCallback(async (id: string) => {
    try {
      await deleteHoliday(id);
      setHolidays((current) => current.filter((x) => x.id !== id));
    } catch (err: any) {
      console.error('Failed to delete holiday:', err);
      setError(err.message || 'Failed to delete holiday');
    }
  }, []);

  return {
    // Auth
    user,
    isEmployee,
    // Data
    employees,
    stats,
    loading,
    error,
    // Employee view
    monthLabel,
    monthlyRecords,
    presentDays,
    absentDays,
    lateDays,
    leavesTaken,
    // Filters
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    holidayMsg,
    // Admin tabs
    activeTab,
    setActiveTab,
    manualOpen,
    setManualOpen,
    viewDate,
    setViewDate,
    summaryMode,
    setSummaryMode,
    // Admin data
    holidays,
    setHolidays,
    corrections,
    setCorrections,
    correctionHistory,
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
    dayRecords,
    filteredDayRecords,
    summaryCounts,
    pendingCorrections,
    adminTabs,
    agg,
    summaryLabel,
    // Handlers (all backed by Supabase)
    handleAddManual,
    handleUpdateRecord,
    handleDeleteRecord,
    handleApproveCorrection,
    handleRejectCorrection,
    handleAddHoliday,
    handleDeleteHoliday,
    handleSelfCheckIn,
    handleSelfCheckOut,
    // Employee reference
    employee,
  };
}

export type UseAttendanceReturn = ReturnType<typeof useAttendance>;
