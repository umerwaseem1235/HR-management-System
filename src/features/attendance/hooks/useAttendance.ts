'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type { AttendanceRecord, Employee } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLeave } from '@/contexts/LeaveContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { timeToMinutes, toDateStr, todayStr } from '@/utils/date';
import type { CorrectionHistoryEntry, CorrectionRequest, Holiday } from '../types';
import { aggregate, calcWorkHours, DEFAULT_LATE_RULE, resolveLateStatus, applyEarlyCheckoutRule, type LateArrivalRule } from '../utils';
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
import { cachedQuery } from '@/lib/query-cache';

export type SummaryMode = 'daily' | 'weekly' | 'monthly';

export interface TodayStats {
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
}

export function useAttendance() {
  const { user, isLoading: authLoading } = useAuth();
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
  const [lateRule, setLateRule] = useState<LateArrivalRule>(DEFAULT_LATE_RULE);

  const isEmployee = user?.role === 'employee';

  // Auth-linked employee id (stable primitive for effect deps).
  const userEmployeeId = user?.employeeId ?? '';

  // Months fully loaded into attendRecords ('YYYY-MM'). The initial load
  // covers the current month, so day switches inside it need no refetch.
  const loadedMonths = useRef<Set<string>>(new Set());

  // ── Expose stats (live from Supabase) ──────────────────────────────
  const stats = todayStatsData;

  // ── Initial data load ──────────────────────────────────────────────
  // Waits for auth so the first fetch uses the right role scope, and
  // employees only load their own records (admin-only resources like the
  // directory, correction queue, audit history and holidays are skipped).
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1; // 1-indexed for server action
        const prefix = `${year}-${String(month).padStart(2, '0')}`;

        if (isEmployee) {
          const [attData, statsData] = await Promise.all([
            userEmployeeId
              ? getAttendanceByEmployee(userEmployeeId, year, month)
              : getAllAttendance(year, month),
            getAttendanceStats(),
          ]);
          if (cancelled) return;
          setAttendRecords(attData);
          setTodayStatsData(statsData);
        } else {
          const [empData, attData, corrData, histData, holData, statsData] =
            await Promise.all([
              cachedQuery('employees', getEmployees),
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
        }
        loadedMonths.current.add(prefix);
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
  }, [authLoading, isEmployee, userEmployeeId]);

  // ── Load other months on demand (admin daily log / summaries) ────────
  // Fetches the whole month so summaries stay correct; months already
  // loaded (e.g. the initial current month) are skipped entirely.
  useEffect(() => {
    const prefix = viewDate.slice(0, 7);
    if (loadedMonths.current.has(prefix)) return;
    let cancelled = false;
    async function loadMonthRecords() {
      try {
        const y = Number(viewDate.slice(0, 4));
        const m = Number(viewDate.slice(5, 7));
        if (!Number.isFinite(y) || !Number.isFinite(m)) return;
        const monthData = await getAllAttendance(y, m);
        if (cancelled) return;
        loadedMonths.current.add(prefix);
        // Merge month records in — replace rows for this month, keep the rest
        setAttendRecords((prev) => {
          const ids = new Set(monthData.map((r) => r.id));
          const keys = new Set(monthData.map((r) => `${r.employeeId}|${r.date}`));
          const outside = prev.filter(
            (r) => !r.date.startsWith(prefix) && !ids.has(r.id) && !keys.has(`${r.employeeId}|${r.date}`),
          );
          return [...outside, ...monthData];
        });
      } catch (err: any) {
        console.error('Failed to load month records:', err);
      }
    }
    loadMonthRecords();
    return () => { cancelled = true; };
  }, [viewDate]);

  // ── Employee resolution ────────────────────────────────────────────
  // Primary: the auth-linked employee id from getCurrentUser
  // (employees.user_id). Fallbacks cover legacy rows where user_id was
  // never backfilled — match by email, then by full name.
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

  // Reliable id for the logged-in employee — never depend on the
  // employees list alone (it can be stale/filtered); user.employeeId
  // comes straight from the employees.user_id link.
  const resolvedEmployeeId = user?.employeeId ?? employee?.id ?? '';

  // ── Employee monthly stats ─────────────────────────────────────────
  const {
    monthLabel,
    monthlyRecords,
    presentDays,
    absentDays,
    lateDays,
    halfDayDays,
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
      halfDayDays: 0,
      leavesTaken: 0,
    };
    if (!user || !isEmployee) return empty;

    const empId = resolvedEmployeeId;
    const userNameLower = user.name.toLowerCase();
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;

    // Filter real DB records for this employee + month.
    // Match by id first; fall back to name so legacy rows (no user_id
    // link) still show instead of an empty table.
    const isMine = (employeeId: string, employeeName: string) =>
      (empId ? employeeId === empId : false) ||
      employeeName.toLowerCase() === userNameLower;

    // Filter real DB records for this employee + month
    const monthlyRecords = attendRecords
      .filter(
        (a) =>
          isMine(a.employeeId, a.employeeName) &&
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
    const halfDayDays = monthlyRecords.filter(
      (r) => r.status === 'Half Day',
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
          isMine(l.employeeId, l.employeeName) &&
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
      halfDayDays,
      // Each Half Day (incl. auto-marked early checkouts) counts as 0.5 leave.
      leavesTaken: Math.round((attendanceLeaveDates.size + approvedLeaveDays + halfDayDays * 0.5) * 10) / 10,
    };
  }, [user, isEmployee, resolvedEmployeeId, leaveRequests, attendRecords]);

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
    { id: 'rules', label: 'Rules' },
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

  // ── Late-arrival rule: auto-mark status from check-in time ───────────
  // Remote (late-rule) feature applied on top of the Supabase-backed
  // handlers below — explicit non-attendance statuses are never overridden.
  const applyLateRule = (checkIn: string, chosenStatus: string): string => {
    if (!lateRule.enabled || !checkIn) return chosenStatus;
    if (['Absent', 'Leave', 'Holiday', 'Weekend'].includes(chosenStatus)) return chosenStatus;
    return resolveLateStatus(checkIn, lateRule).status;
  };

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
  // Uses the resolved employee id (auth link first) so the buttons work
  // even when the employees list hasn't matched this user, and writes
  // the real current time via the server action.
  const handleSelfCheckIn = useCallback(async () => {
    if (!resolvedEmployeeId) {
      setError('Unable to identify your employee record. Please sign in again or contact HR.');
      return;
    }
    try {
      const newRecord = await selfCheckInOut(resolvedEmployeeId, todayStr(), 'check_in');
      // Update local state
      setAttendRecords((current) => {
        const without = current.filter((r) => !(r.employeeId === resolvedEmployeeId && r.date === todayStr()));
        return [newRecord, ...without];
      });
      await refreshStats();
    } catch (err: any) {
      console.error('Failed to check in:', err);
      setError(err.message || 'Failed to check in');
    }
  }, [resolvedEmployeeId, refreshStats]);

  const handleSelfCheckOut = useCallback(async () => {
    if (!resolvedEmployeeId) {
      setError('Unable to identify your employee record. Please sign in again or contact HR.');
      return;
    }
    try {
      const newRecord = await selfCheckInOut(resolvedEmployeeId, todayStr(), 'check_out');
      setAttendRecords((current) => {
        const without = current.filter((r) => !(r.employeeId === resolvedEmployeeId && r.date === todayStr()));
        return [newRecord, ...without];
      });
      await refreshStats();
    } catch (err: any) {
      console.error('Failed to check out:', err);
      setError(err.message || 'Failed to check out');
    }
  }, [resolvedEmployeeId, refreshStats]);

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

      // Apply the late-arrival rule so manual entries respect it, then the
      // early-checkout rule (15+ min before off time = Half Day / half leave).
      const lateAdjusted = applyLateRule(values.checkIn, values.status);
      const finalStatus = applyEarlyCheckoutRule(values.checkOut, lateAdjusted);
      const workHours = calcWorkHours(
        values.checkIn,
        values.checkOut,
        finalStatus,
      );

      try {
        const newRecord = await createAttendanceRecord({
          employeeId: emp.id,
          date: values.date,
          checkIn: values.checkIn,
          checkOut: values.checkOut,
          status: finalStatus as AttendanceRecord['status'],
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
    [employees, lateRule, refreshStats],
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
      // Apply the late-arrival rule so edits respect it, then the
      // early-checkout rule (15+ min before off time = Half Day / half leave).
      const lateAdjusted = applyLateRule(values.checkIn, values.status);
      const finalStatus = applyEarlyCheckoutRule(values.checkOut, lateAdjusted);
      const workHours = calcWorkHours(
        values.checkIn,
        values.checkOut,
        finalStatus,
      );
      // Capture the pre-edit snapshot for the correction-history audit trail
      const before = attendRecords.find((r) => r.id === id);
      try {
        await updateAttendanceRecord(id, {
          checkIn: values.checkIn,
          checkOut: values.checkOut,
          status: finalStatus,
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
                  status: finalStatus as AttendanceRecord['status'],
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
            summarizeAttendance(finalStatus, values.checkIn, values.checkOut),
          );
        }
      } catch (err: any) {
        console.error('Failed to update record:', err);
        setError(err.message || 'Failed to update attendance record');
      }
    },
    [attendRecords, lateRule, logCorrection, refreshStats],
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
    halfDayDays,
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
    lateRule,
    setLateRule,
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
    employeeId: resolvedEmployeeId,
  };
}

export type UseAttendanceReturn = ReturnType<typeof useAttendance>;
