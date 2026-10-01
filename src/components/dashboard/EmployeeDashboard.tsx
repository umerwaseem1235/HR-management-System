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
import { useLanguage } from '../../contexts/LanguageContext';

import { useEmployeeDirectory } from '../../hooks/useEmployeeDirectory';
import { checkInWithLocation, checkOutWithLocation } from '@/lib/actions/attendance';
import { getEmployeeDashboardBundle } from '@/lib/actions/employee-dashboard';
import { cachedQuery, peekStaleQuery, primeQuery } from '../../lib/query-cache';
import { employeeDashboardKey, invalidateAttendanceCache } from '../../lib/attendance-cache';
import type { LeaveBalance, Payslip, ProgressEntry } from '../../lib/types';

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

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { findByUser } = useEmployeeDirectory();
  // Prefer the employee id auth already resolved — the bundle fires without
  // waiting on the full directory. Directory stays as fallback (matching by
  // email for legacy users without a linked employee id).
  const directoryEmployee = useMemo(() => findByUser(user), [findByUser, user]);
  const employeeId = user?.employeeId || directoryEmployee?.id || '';
  // Stale-while-revalidate paint: last visit's bundle (if any) renders on the
  // first frame when navigating back to the dashboard — no spinner, no zeros.
  const cachedBundle = employeeId
    ? peekStaleQuery<DashboardBundle>(employeeDashboardKey(employeeId))
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
    if (!employeeId) return;
    let cancelled = false;
    const key = employeeDashboardKey(employeeId);
    (async () => {
      try {
        // Single round trip (was 7 parallel actions). Concurrent mounts share
        // one inflight request; a warm cache resolves instantly.
        const bundle = await cachedQuery(key, () => getEmployeeDashboardBundle(employeeId));
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
  }, [employeeId]);

  // Keep the cache in sync after check-in/out so the next visit paints the
  // correct button state instantly instead of refetching. Skipped until the
  // first full load has landed, so a partial bundle is never cached. The
  // attendance module shows the same row, so drop its cache too.
  const primeBundle = (patch: Partial<DashboardBundle>) => {
    if (!employeeId) return;
    // Attendance module shows the same row — always drop its cache so the
    // next visit refetches (even if this dashboard's bundle isn't cached yet).
    invalidateAttendanceCache(employeeId);
    const key = employeeDashboardKey(employeeId);
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
        <PageHeader title={`${t('dashboard.welcome')}!`} />
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

      const eid = employeeId || user?.id || '';
      if (!eid) {
        setActionError('Unable to identify employee. Please refresh and try again.');
        setActionLoading(false);
        return;
      }

      const result = await checkInWithLocation({
        employeeId: eid,
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

      const eid = employeeId || user?.id || '';
      if (!eid) {
        setActionError('Unable to identify employee. Please refresh and try again.');
        setActionLoading(false);
        return;
      }

      const result = await checkOutWithLocation({
        employeeId: eid,
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
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome + Check In/Out */}
      <PageHeader
        title={`${t('dashboard.welcome')}, ${user?.name?.split(' ')[0]}! 👋`}
        actions={
          <>
            {checkInTime && (
              <span className="w-full sm:w-auto text-xs sm:text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 sm:mr-4">Checked in at {checkInTime}</span>
            )}
            {!checkedIn ? (
              <Button
                variant="primary"
                onClick={handleCheckIn}
                disabled={actionLoading}
                size="sm"
                className="sm:min-w-[140px]"
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
                size="sm"
                className="sm:min-w-[140px]"
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
        <Card className="border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30">
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center">
              <AlertCircle size={18} className="text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-red-800">Check-in Failed</p>
              <p className="text-sm text-red-700 dark:text-red-400 mt-1">{actionError}</p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-2">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-stretch">
        {/* Leave Balances */}
        <EmployeeLeaveBalances balances={visibleLeaveBalances} />

        {/* My Progress (this month) */}
        <EmployeeProgress entries={progressEntries} monthLabel={monthSummary.monthLabel} />
      </div>

      {/* Hidden on mobile — Notifications + Recent Payslips show on lg screens and up only */}
      <div className="hidden lg:grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <EmployeeNotifications notifications={employeeNotifs} />

        {/* Recent Payslips */}
        <EmployeePayslips payslips={slips} />
      </div>

      {/* Office Location Info */}
      <Card className="border-medium-gray">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-1 sm:p-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-[#E3EFFE] flex items-center justify-center">
              <MapPin size={20} className="text-teal" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-primary dark:text-blue-gray-light text-sm sm:text-base">Office Location Check</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1 leading-relaxed">
                Check-ins require you to be within <strong>{OFFICE_LOCATION.radiusMeters}m</strong> of the office.
                Your location is verified on both your device and our servers for security.
              </p>
            </div>
          </div>
          <div className="flex sm:flex-col gap-3 sm:gap-1 sm:text-right pl-[52px] sm:pl-0 shrink-0">
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Lat: {OFFICE_LOCATION.latitude.toFixed(6)}</p>
            <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Lng: {OFFICE_LOCATION.longitude.toFixed(6)}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
