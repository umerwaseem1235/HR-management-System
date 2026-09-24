'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import type { AttendanceRecord, Employee } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLeave } from '@/contexts/LeaveContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { timeToMinutes, toDateStr, todayStr } from '@/utils/date';
import type { CorrectionHistoryEntry, CorrectionRequest, Holiday } from '../types';
import { aggregate, calcWorkHours, DEFAULT_LATE_RULE, resolveLateStatus, type LateArrivalRule } from '../utils';
import { createAuditLog, getAuditLogsByModule } from '@/lib/actions/audit';
import { createResourceCache } from '@/lib/resource-cache';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Everything the attendance page renders from its initial aggregate load. */
interface AttendanceSnapshot {
  employees: Employee[];
  records: AttendanceRecord[];
  corrections: CorrectionRequest[];
  history: CorrectionHistoryEntry[];
  holidays: Holiday[];
  stats: TodayStats;
}

function toAttendanceSnapshot(data: Awaited<ReturnType<typeof getAttendanceData>>): AttendanceSnapshot {
  return {
    employees: data.employees as unknown as Employee[],
    records: data.records,
    corrections: data.corrections as unknown as CorrectionRequest[],
    history: mapAuditToHistory(data.auditLogs as unknown as Parameters<typeof mapAuditToHistory>[0]),
    holidays: data.holidays,
    stats: data.stats,
  };
}

// Module scope survives navigation, so returning to /attendance paints
// instantly instead of re-running the aggregate query. Keyed by month.
function attendanceCacheFor(monthKey: string) {
  return createResourceCache<AttendanceSnapshot>(`attendance:data:${monthKey}`, 60_000);
}

// Day slices: switching the date picker used to refetch on EVERY change —
// even for dates already inside the loaded month. Cached per date so
// revisiting a date is instant and the initial mount (today) usually needs
// no extra query at all.
function dayCacheFor(date: string) {
  return createResourceCache<AttendanceRecord[]>(`attendance:day:${date}`, 60_000);
}

/** Idle-warmer: fills the month cache without touching React state. */
export function warmAttendanceCache(): void {
  try {
    const n = new Date();
    const key = `${n.getFullYear()}-${n.getMonth() + 1}`;
    const cache = attendanceCacheFor(key);
    if (cache.peek()) return;
    void cache.load(() => getAttendanceData(n.getFullYear(), n.getMonth() + 1).then(toAttendanceSnapshot)).catch(() => {});
  } catch {
    // Never let a prefetch break the page.
  }
}

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
  getAttendanceByDate,
  getAttendanceData,
  getAttendanceStats,
  createAttendanceRecord,
  updateAttendanceRecord,
  updateCorrectionStatus,
  createHoliday,
  deleteHoliday,
  deleteAttendanceRecord,
  selfCheckInOut,
} from '@/lib/actions/attendance';

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
  // The aggregate always covers the current month; the cache key follows it.
  const [monthKey] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${n.getMonth() + 1}`;
  });
  // Lazy-init from the module cache so a warm revisit paints on the very
  // first render instead of flashing a loader before the effect runs.
  const [loading, setLoading] = useState(() => attendanceCacheFor(monthKey).get() === null);
  const [error, setError] = useState<string | null>(null);
  // Becomes true once real (or cached) data has been applied; gates the cache
  // write-back so empty initial state never overwrites the snapshot.
  const [ready, setReady] = useState(false);

  // ── Core data (from Supabase) ──────────────────────────────────────
  const [employees, setEmployees] = useState<Employee[]>(() => attendanceCacheFor(monthKey).get()?.employees ?? []);
  const [attendRecords, setAttendRecords] = useState<AttendanceRecord[]>(() => attendanceCacheFor(monthKey).get()?.records ?? []);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>(() => attendanceCacheFor(monthKey).get()?.corrections ?? []);
  const [correctionHistory, setCorrectionHistory] = useState<CorrectionHistoryEntry[]>(() => attendanceCacheFor(monthKey).get()?.history ?? []);
  const [holidays, setHolidays] = useState<Holiday[]>(() => attendanceCacheFor(monthKey).get()?.holidays ?? []);
  const [todayStatsData, setTodayStatsData] = useState<TodayStats>(() => attendanceCacheFor(monthKey).get()?.stats ?? {
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

  // ── Expose stats (live from Supabase) ──────────────────────────────
  const stats = todayStatsData;

  // ── Initial data load (cached across navigation) ────────────────────
  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      const cache = attendanceCacheFor(monthKey);
      const snapshot = cache.peek();
      if (snapshot) {
        if (!cancelled) {
          setEmployees(snapshot.data.employees);
          setAttendRecords(snapshot.data.records);
          setCorrections(snapshot.data.corrections);
          setCorrectionHistory(snapshot.data.history);
          setHolidays(snapshot.data.holidays);
          setTodayStatsData(snapshot.data.stats);
          setReady(true);
          setLoading(false);
        }
        if (!snapshot.isStale) return;
      } else if (!cancelled) {
        setLoading(true);
      }
      setError(null);
      try {
        const now = new Date();
        const data = await cache.load(() => getAttendanceData(now.getFullYear(), now.getMonth() + 1).then(toAttendanceSnapshot), { force: true });
        if (cancelled) return;
        setEmployees(data.employees);
        setAttendRecords(data.records);
        setCorrections(data.corrections);
        setCorrectionHistory(data.history);
        setHolidays(data.holidays);
        setTodayStatsData(data.stats);
        setReady(true);
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
  }, [monthKey]);

  // Keep the cached snapshot in sync with local mutations (manual entries,
  // edits, holiday changes) so the next mount is current. The viewed-date
  // slice is mirrored too, so a cached day can never overwrite fresh edits.
  useEffect(() => {
    if (!ready) return;
    attendanceCacheFor(monthKey).set({
      employees,
      records: attendRecords,
      corrections,
      history: correctionHistory,
      holidays,
      stats: todayStatsData,
    });
    if (viewDate) {
      const slice = attendRecords.filter((r) => r.date === viewDate);
      if (slice.length > 0) dayCacheFor(viewDate).set(slice);
    }
  }, [ready, monthKey, employees, attendRecords, corrections, correctionHistory, holidays, todayStatsData, viewDate]);

  // ── Day records: cached per date, skipped when already covered ─────
  // Before: EVERY viewDate change (including the initial mount for today,
  // already inside the month aggregate) fired getAttendanceByDate. Now: serve
  // the per-date cache instantly, skip entirely when the month snapshot
  // already holds rows for that date, and only hit the server otherwise.
  useEffect(() => {
    let cancelled = false;
    async function loadDayRecords() {
      const cache = dayCacheFor(viewDate);
      const snapshot = cache.peek();
      if (snapshot && !snapshot.isStale) {
        if (!cancelled && snapshot.data.length > 0) {
          setAttendRecords((prev) => {
            if (prev.some((r) => r.date === viewDate)) return prev;
            const otherDates = prev.filter((r) => r.date !== viewDate);
            return [...otherDates, ...snapshot.data];
          });
        }
        return;
      }
      try {
        const dayData = await cache.load(() => getAttendanceByDate(viewDate));
        if (cancelled) return;
        // Merge day records into attendRecords — replace records for this date
        setAttendRecords((prev) => {
          const otherDates = prev.filter((r) => r.date !== viewDate);
          // No-op when the month aggregate already covered this date with
          // the same row count — avoids a redundant render pass.
          const current = prev.filter((r) => r.date === viewDate);
          if (current.length === dayData.length && dayData.length > 0) return prev;
          return [...otherDates, ...dayData];
        });
      } catch (err: any) {
        console.error('Failed to load day records:', err);
      }
    }
    // Skip the extra query when the aggregate already delivered this date
    // (the common case: initial mount for today + same-month switches).
    // attendRecords is intentionally NOT a dep — it would refetch in a loop.
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
      halfDayDays,
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

      // Apply the late-arrival rule so manual entries respect it.
      const finalStatus = applyLateRule(values.checkIn, values.status);
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
      // Apply the late-arrival rule so edits respect it.
      const finalStatus = applyLateRule(values.checkIn, values.status);
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
  };
}

export type UseAttendanceReturn = ReturnType<typeof useAttendance>;
