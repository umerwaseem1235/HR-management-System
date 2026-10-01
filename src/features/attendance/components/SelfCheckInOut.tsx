'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, LogIn, LogOut } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import {
  checkInWithLocation,
  checkOutWithLocation,
  getMyCheckInStatus,
} from '@/lib/actions/attendance';
import { invalidateAttendanceCache } from '@/lib/attendance-cache';

interface SelfCheckInOutProps {
  /** Resolved linked employees.id (may be '' until the directory/auth resolves). */
  employeeId?: string;
  /** When provided, the parent owns the checked-in state (e.g. employee bundle). */
  initialCheckedIn?: boolean;
  initialCheckInTime?: string | null;
  onStatusChange?: (checkedIn: boolean, checkInTime: string | null) => void;
  onError?: (message: string | null) => void;
}

function toFriendlyError(err: unknown, fallback: string) {
  const msg = err instanceof Error ? err.message : fallback;
  if (/Minified React error #441|Server Components render/i.test(msg)) {
    return 'Check-in could not be saved (server error). Most common cause: the location columns are missing in the database. Please run supabase/migrations/007_attendance_location.sql in Supabase, then try again.';
  }
  return msg || fallback;
}

function getCurrentPosition(): Promise<GeolocationPosition> {
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
}

function geoErrorMessage(err: unknown, action: 'in' | 'out') {
  if (err instanceof GeolocationPositionError) {
    switch (err.code) {
      case err.PERMISSION_DENIED:
        return 'Location permission denied. Please enable location access to check ' + action + '.';
      case err.POSITION_UNAVAILABLE:
        return 'Location information is unavailable. Please try again.';
      case err.TIMEOUT:
        return 'Location request timed out. Please try again.';
      default:
        return 'An unknown error occurred while getting location.';
    }
  }
  return null;
}

/**
 * Shared self check-in/out controls — identical UX on the employee dashboard
 * and the admin (HR) dashboard. Resolves the caller's linked employee record
 * (auto-created server-side on first check-in, so HR counts as an employee),
 * verifies office proximity on device, and records the stamp server-side.
 */
export default function SelfCheckInOut({
  employeeId = '',
  initialCheckedIn,
  initialCheckInTime = null,
  onStatusChange,
  onError,
}: SelfCheckInOutProps) {
  const { user } = useAuth();
  // Local state is the source of truth only in self-owned mode (admin
  // header). In parent-owned mode the bundle props below take precedence.
  const [localCheckedIn, setLocalCheckedIn] = useState(initialCheckedIn ?? false);
  const [localCheckInTime, setLocalCheckInTime] = useState<string | null>(initialCheckInTime);
  const [loading, setLoading] = useState(false);

  const parentOwned = initialCheckedIn !== undefined;
  const checkedIn = parentOwned ? initialCheckedIn : localCheckedIn;
  const checkInTime = parentOwned ? initialCheckInTime : localCheckInTime;

  // Latest callbacks without re-subscribing effects (parents pass inline fns).
  const callbacksRef = useRef({ onStatusChange, onError });
  useEffect(() => {
    callbacksRef.current = { onStatusChange, onError };
  });

  // Self-owned mode: lean status lookup once on mount (deferred to a promise
  // callback so no setState runs synchronously in the effect body).
  useEffect(() => {
    if (initialCheckedIn !== undefined) return;
    let cancelled = false;
    void Promise.resolve().then(async () => {
      try {
        const s = await getMyCheckInStatus();
        if (cancelled) return;
        setLocalCheckedIn(s.checkedIn);
        setLocalCheckInTime(s.checkInTime);
        callbacksRef.current.onStatusChange?.(s.checkedIn, s.checkInTime);
      } catch {
        // Ignore — the buttons still work; the server resolves on submit.
      }
    });
    return () => {
      cancelled = true;
    };
  }, [initialCheckedIn]);

  function applyStatus(nextCheckedIn: boolean, nextCheckInTime: string | null, eid: string) {
    setLocalCheckedIn(nextCheckedIn);
    setLocalCheckInTime(nextCheckInTime);
    invalidateAttendanceCache(eid);
    callbacksRef.current.onStatusChange?.(nextCheckedIn, nextCheckInTime);
  }

  function reportError(message: string | null) {
    callbacksRef.current.onError?.(message);
  }

  async function handleCheckIn() {
    setLoading(true);
    reportError(null);
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const today = new Date().toISOString().split('T')[0];
      const stamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const eid = employeeId || user?.employeeId || user?.id || '';
      if (!eid) {
        reportError('Unable to identify employee. Please refresh and try again.');
        setLoading(false);
        return;
      }
      const result = await checkInWithLocation({
        employeeId: eid,
        date: today,
        checkIn: stamp,
        latitude,
        longitude,
      });
      if (result.success) {
        applyStatus(true, stamp, eid);
      } else {
        reportError(result.error || 'Check-in failed');
      }
    } catch (err) {
      reportError(geoErrorMessage(err, 'in') ?? toFriendlyError(err, 'Check-in failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckOut() {
    setLoading(true);
    reportError(null);
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const today = new Date().toISOString().split('T')[0];
      const stamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      const eid = employeeId || user?.employeeId || user?.id || '';
      if (!eid) {
        reportError('Unable to identify employee. Please refresh and try again.');
        setLoading(false);
        return;
      }
      const result = await checkOutWithLocation({
        employeeId: eid,
        date: today,
        checkOut: stamp,
        latitude,
        longitude,
      });
      if (result.success) {
        applyStatus(false, null, eid);
      } else {
        reportError(result.error || 'Check-out failed');
      }
    } catch (err) {
      reportError(geoErrorMessage(err, 'out') ?? toFriendlyError(err, 'Check-out failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {checkInTime && (
        <span className="w-full sm:w-auto text-xs sm:text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 sm:mr-4">
          Checked in at {checkInTime}
        </span>
      )}
      {!checkedIn ? (
        <Button variant="primary" onClick={() => void handleCheckIn()} disabled={loading} size="sm" className="sm:min-w-[140px]">
          {loading ? (
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
        <Button variant="danger" onClick={() => void handleCheckOut()} disabled={loading} size="sm" className="sm:min-w-[140px]">
          {loading ? (
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
  );
}
