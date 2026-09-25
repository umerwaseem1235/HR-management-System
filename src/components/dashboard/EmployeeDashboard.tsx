'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { LogIn, LogOut, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import EmployeeStats from './employee/EmployeeStats';
import EmployeeLeaveBalances from './employee/EmployeeLeaveBalances';
import EmployeeProgress from './employee/EmployeeProgress';
import EmployeeNotifications from './employee/EmployeeNotifications';
import EmployeePayslips from './employee/EmployeePayslips';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useEmployeeDirectory } from '../../hooks/useEmployeeDirectory';
import { getLeaveBalances, getLeaveRequests } from '../../lib/actions/leave';
import { getPayslips } from '../../lib/actions/payroll';
import { checkInWithLocation, checkOutWithLocation, getAttendanceByDate, getAttendanceByEmployee, getHolidays } from '@/lib/actions/attendance';
import { getProgressEntries } from '@/lib/actions/progress';
import { cachedQuery, peekStaleQuery, primeQuery } from '../../lib/query-cache';
import { employeeDashboardKey, invalidateAttendanceCache } from '../../lib/attendance-cache';
import { toDateStr } from '@/utils/date';
import type { Employee, LeaveBalance, Payslip, ProgressEntry } from '../../lib/types';

const OFFICE_LOCATION = {
  latitude: 32.17989,
  longitude: 74.18584,
  radiusMeters: 500,
};

interface DashboardBundle {
  balances: LeaveBalance[];
  slips: Payslip[];
  progressEntries: ProgressEntry[];
  monthSummary: { worked: number; total: number; leavesTaken: number; monthLabel: string };
  checkedIn: boolean;
  checkInTime: string | null;
}

async function loadDashboardBundle(employee: Employee): Promise<DashboardBundle> {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const year = now.getFullYear();
  const monthIdx = now.getMonth();
  const monthNum = monthIdx + 1;
  const prefix = `${year}-${String(monthNum).padStart(2, '0')}`;
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const [b, s, att, hols, leaveReqs, prog, todayRows] = await Promise.all([
    getLeaveBalances(employee.id),
    getPayslips(employee.id),
    getAttendanceByEmployee(employee.id, year, monthNum),
    getHolidays(),
    getLeaveRequests(employee.id),
    getProgressEntries(employee.id),
    getAttendanceByDate(today),
  ]);

  // ── Real monthly summary (current month, up to today) ──
  const mine = att.filter((r) => r.date.startsWith(prefix) && r.date <= today);
  const presentLike = mine.filter((r) => r.status === 'Present' || r.status === 'Late').length;
  const halfLike = mine.filter((r) => r.status === 'Half Day').length;
  const worked = Math.round((presentLike + halfLike * 0.5) * 10) / 10;

  // Working-day denominator: weekdays elapsed this month minus holidays.
  const monthStart = new Date(year, monthIdx, 1);
  const todayDate = new Date(today + 'T00:00:00');
  let total = 0;
  for (let d = new Date(monthStart); d <= todayDate; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) total++;
  }
  const holidayDates = new Set(
    hols
      .filter((h) => h.date >= toDateStr(monthStart) && h.date <= today)
      .filter((h) => {
        const hd = new Date(h.date + 'T00:00:00');
        const w = hd.getDay();
        return w !== 0 && w !== 6;
      })
      .map((h) => h.date),
  );
  total = Math.max(0, total - holidayDates.size);

  // Leaves taken: 'Leave' attendance days + approved request days in month.
  const leaveDates = new Set(mine.filter((r) => r.status === 'Leave').map((r) => r.date));
  let approvedExtra = 0;
  const monthEnd = new Date(year, monthIdx + 1, 0);
  leaveReqs
    .filter((l) => l.status === 'Approved')
    .forEach((l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
      const overlapStart = start > monthStart ? start : monthStart;
      const overlapEnd = end < monthEnd ? end : monthEnd;
      for (let d = new Date(overlapStart); d <= overlapEnd; d.setDate(d.getDate() + 1)) {
        const ds = toDateStr(d);
        if (ds > today) continue;
        if (!leaveDates.has(ds)) approvedExtra++;
      }
    });

  const todayMine = todayRows.find((r) => r.employeeId === employee.id);
  return {
    balances: b,
    slips: s,
    progressEntries: prog.filter((p) => p.submissionDate.startsWith(prefix)),
    monthSummary: {
      worked,
      total,
      leavesTaken: leaveDates.size + approvedExtra,
      monthLabel,
    },
    checkedIn: !!todayMine?.checkIn && !todayMine?.checkOut,
    checkInTime: todayMine?.checkIn || null,
  };
}

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { findByUser } = useEmployeeDirectory();
  const employee = useMemo(() => findByUser(user), [findByUser, user]);
  // Stale-while-revalidate paint: last visit's bundle (if any) renders on the
  // first frame when navigating back to the dashboard — no spinner, no zeros.
  const cachedBundle = employee
    ? peekStaleQuery<DashboardBundle>(employeeDashboardKey(employee.id))
    : undefined;

  const [mounted, setMounted] = useState(false);
  const [balances, setBalances] = useState<LeaveBalance[]>(() => cachedBundle?.balances ?? []);
  const [slips, setSlips] = useState<Payslip[]>(() => cachedBundle?.slips ?? []);
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>(
    () => cachedBundle?.progressEntries ?? [],
  );
  const [monthSummary, setMonthSummary] = useState(
    () => cachedBundle?.monthSummary ?? { worked: 0, total: 0, leavesTaken: 0, monthLabel: '' },
  );
  const [checkedIn, setCheckedIn] = useState(() => cachedBundle?.checkedIn ?? false);
  const [checkInTime, setCheckInTime] = useState<string | null>(
    () => cachedBundle?.checkInTime ?? null,
  );
  const [, setLocationError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Mount-guard deferred to the next frame so no setState runs
  // synchronously inside the effect body.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!employee) return;
    let cancelled = false;
    const key = employeeDashboardKey(employee.id);
    (async () => {
      try {
        // Fresh TTL hit resolves instantly (zero round-trips); otherwise the
        // stale paint above stays visible while this revalidates in the
        // background. Concurrent mounts share one inflight request.
        const bundle = await cachedQuery(key, () => loadDashboardBundle(employee));
        if (cancelled) return;
        setBalances(bundle.balances);
        setSlips(bundle.slips);
        setProgressEntries(bundle.progressEntries);
        setMonthSummary(bundle.monthSummary);
        setCheckedIn(bundle.checkedIn);
        setCheckInTime(bundle.checkInTime);
      } catch (err) {
        console.error('Failed to load employee dashboard:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [employee]);

  // Keep the cache in sync after check-in/out so the next visit paints the
  // correct button state instantly instead of refetching. Skipped until the
  // first full load has landed, so a partial bundle is never cached. The
  // attendance module shows the same row, so drop its cache too.
  const primeBundle = (patch: Partial<DashboardBundle>) => {
    if (!employee) return;
    // Attendance module shows the same row — always drop its cache so the
    // next visit refetches (even if this dashboard's bundle isn't cached yet).
    invalidateAttendanceCache(employee.id);
    const key = employeeDashboardKey(employee.id);
    if (peekStaleQuery<DashboardBundle>(key) === undefined) return;
    primeQuery(key, {
      balances,
      slips,
      progressEntries,
      monthSummary,
      checkedIn,
      checkInTime,
      ...patch,
    });
  };

  const { notifications } = useNotifications();

  const employeeNotifs = notifications.filter(n => !n.read).slice(0, 3);

  const visibleLeaveBalances = balances.filter(
    (lb) => lb.leaveType !== 'Maternity Leave' && lb.leaveType !== 'Paternity Leave'
  );

  // Skeleton only when there is nothing to paint. The query cache is always
  // empty during SSR/hydration, so this still matches the server HTML; a
  // warm client-side return skips it entirely and shows cached data frame 1.
  if (!mounted && !cachedBundle) {
    return (
      <div className="space-y-6">
        <PageHeader title="Welcome!" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmployeeStats
            leavesTakenMonth={0}
            workingDaysWorked={0}
            lastPayslipNet={0}
            lastPayslipLabel=""
            progressPosts={0}
            monthLabel=""
          />
          <EmployeeLeaveBalances balances={[]} />
        </div>
      </div>
    );
  }

  const lastSlip = slips[0];
  const lastPayslipLabel = lastSlip ? `${lastSlip.month} ${lastSlip.year}` : 'No payslip yet';
  const workedDisplay = Number.isInteger(monthSummary.worked) ? monthSummary.worked : monthSummary.worked.toFixed(1);

  const toFriendlyError = (err: unknown, fallback: string) => {
    const msg = err instanceof Error ? err.message : fallback;
    if (/Minified React error #441|Server Components render/i.test(msg)) {
      return 'Check-in could not be saved (server error). Most common cause: the location columns are missing in the database. Please run supabase/migrations/007_attendance_location.sql in Supabase, then try again.';
    }
    return msg || fallback;
  };

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    });
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    setActionError(null);
    setLocationError(null);

    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      const today = new Date().toISOString().split('T')[0];
      const checkInTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

      const employeeId = employee?.id || user?.employeeId || user?.id || '';
      if (!employeeId) {
        setActionError('Unable to identify employee. Please refresh and try again.');
        setActionLoading(false);
        return;
      }

      const result = await checkInWithLocation({
        employeeId,
        date: today,
        checkIn: checkInTime,
        latitude,
        longitude,
      });

      if (result.success) {
        setCheckedIn(true);
        setCheckInTime(checkInTime);
        setLocationError(null);
        primeBundle({ checkedIn: true, checkInTime });
      } else {
        setActionError(result.error || 'Check-in failed');
      }
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setActionError('Location permission denied. Please enable location access to check in.');
            break;
          case err.POSITION_UNAVAILABLE:
            setActionError('Location information is unavailable. Please try again.');
            break;
          case err.TIMEOUT:
            setActionError('Location request timed out. Please try again.');
            break;
          default:
            setActionError('An unknown error occurred while getting location.');
        }
      } else {
        setActionError(toFriendlyError(err, 'Check-in failed. Please try again.'));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setActionError(null);
    setLocationError(null);

    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      const today = new Date().toISOString().split('T')[0];
      const checkOutTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

      const employeeId = employee?.id || user?.employeeId || user?.id || '';
      if (!employeeId) {
        setActionError('Unable to identify employee. Please refresh and try again.');
        setActionLoading(false);
        return;
      }

      const result = await checkOutWithLocation({
        employeeId,
        date: today,
        checkOut: checkOutTime,
        latitude,
        longitude,
      });

      if (result.success) {
        setCheckedIn(false);
        setCheckInTime(null);
        setLocationError(null);
        primeBundle({ checkedIn: false, checkInTime: null });
      } else {
        setActionError(result.error || 'Check-out failed');
      }
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setActionError('Location permission denied. Please enable location access to check out.');
            break;
          case err.POSITION_UNAVAILABLE:
            setActionError('Location information is unavailable. Please try again.');
            break;
          case err.TIMEOUT:
            setActionError('Location request timed out. Please try again.');
            break;
          default:
            setActionError('An unknown error occurred while getting location.');
        }
      } else {
        setActionError(toFriendlyError(err, 'Check-out failed. Please try again.'));
      }
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome + Check In/Out */}
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0]}! 👋`}
        actions={
          <>
            {checkInTime && (
              <span className="text-sm text-gray-500 mr-4">Checked in at {checkInTime}</span>
            )}
            {!checkedIn ? (
              <Button
                variant="primary"
                onClick={handleCheckIn}
                disabled={actionLoading}
                className="min-w-[140px]"
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <LogIn size={16} /> Check In
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleCheckOut}
                disabled={actionLoading}
                className="min-w-[140px]"
              >
                {actionLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    <LogOut size={16} /> Check Out
                  </>
                )}
              </Button>
            )}
          </>
        }
      />

      {actionError && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle size={18} className="text-red-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-800">Check-in Failed</p>
              <p className="text-sm text-red-700 mt-1">{actionError}</p>
              <p className="text-xs text-red-600 mt-2">
                You must be within {OFFICE_LOCATION.radiusMeters}m of the office to check in.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Stats */}
      <EmployeeStats
        leavesTakenMonth={monthSummary.leavesTaken}
        workingDaysWorked={workedDisplay}
        lastPayslipNet={lastSlip?.netSalary || 0}
        lastPayslipLabel={lastPayslipLabel}
        progressPosts={progressEntries.length}
        monthLabel={monthSummary.monthLabel}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Leave Balances */}
        <EmployeeLeaveBalances balances={visibleLeaveBalances} />

        {/* My Progress (this month) */}
        <EmployeeProgress entries={progressEntries} monthLabel={monthSummary.monthLabel} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <EmployeeNotifications notifications={employeeNotifs} />

        {/* Recent Payslips */}
        <EmployeePayslips payslips={slips} />
      </div>

      {/* Office Location Info */}
      <Card className="border-[#D6E4E8]">
        <div className="flex items-center gap-3 p-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#E3EFFE] flex items-center justify-center">
            <MapPin size={20} className="text-[#024fa7]" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-[#17324D]">Office Location Check</p>
            <p className="text-sm text-gray-500 mt-1">
              Check-ins require you to be within <strong>{OFFICE_LOCATION.radiusMeters}m</strong> of the office.
              Your location is verified on both your device and our servers for security.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Lat: {OFFICE_LOCATION.latitude.toFixed(6)}</p>
            <p className="text-xs text-gray-500">Lng: {OFFICE_LOCATION.longitude.toFixed(6)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
