'use client';

import React, { useState, useEffect } from 'react';
import { LogIn, LogOut, MapPin, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';
import Card from '../ui/Card';
import EmployeeStats from './employee/EmployeeStats';
import EmployeeLeaveBalances from './employee/EmployeeLeaveBalances';
import EmployeeGoals from './employee/EmployeeGoals';
import EmployeeNotifications from './employee/EmployeeNotifications';
import EmployeePayslips from './employee/EmployeePayslips';
import { mockLeaveBalances, mockPayslips, mockGoals } from '../../lib/mock-data';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { checkInWithLocation, checkOutWithLocation } from '@/lib/actions/attendance';

const OFFICE_LOCATION = {
  latitude: 32.180210165328184,
  longitude: 74.18567218742997,
  radiusMeters: 500,
};

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [distanceFromOffice, setDistanceFromOffice] = useState<number | null>(null);
  const [checkingInOut, setCheckingInOut] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { notifications } = useNotifications();

  const employeeNotifs = notifications.filter(n => !n.read).slice(0, 3);

  const visibleLeaveBalances = mockLeaveBalances.filter(
    (lb) => lb.leaveType !== 'Maternity Leave' && lb.leaveType !== 'Paternity Leave'
  );

  if (!mounted) {
    return (
      <div className="space-y-6">
        <PageHeader title="Welcome!" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <EmployeeStats
            leaveRemainingTotal={0}
            lastPayslipNet={0}
            goalsCompleted={0}
            goalsTotal={0}
          />
          <EmployeeLeaveBalances balances={[]} />
        </div>
      </div>
    );
  }

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
      setDistanceFromOffice(null);

      const today = new Date().toISOString().split('T')[0];
      const checkInTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

      const employeeId = user?.employeeId || user?.id || '';
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
        setDistanceFromOffice(result.distance || null);
        setLocationError(null);
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
        setActionError(err instanceof Error ? err.message : 'Check-in failed. Please try again.');
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

      const employeeId = user?.employeeId || user?.id || '';
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
        setDistanceFromOffice(null);
        setLocationError(null);
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
        setActionError(err instanceof Error ? err.message : 'Check-out failed. Please try again.');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
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
            {distanceFromOffice !== null && (
              <span className="inline-flex items-center gap-1.5 text-sm text-[#024fa7] bg-[#E3EFFE] px-3 py-1 rounded-full">
                <MapPin size={14} />
                {formatDistance(distanceFromOffice)} from office
              </span>
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
        leaveRemainingTotal={visibleLeaveBalances.reduce((sum, lb) => sum + lb.remaining, 0)}
        lastPayslipNet={mockPayslips[0]?.netSalary || 0}
        goalsCompleted={mockGoals.filter(g => g.status === 'Completed').length}
        goalsTotal={mockGoals.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Leave Balances */}
        <EmployeeLeaveBalances balances={visibleLeaveBalances} />

        {/* My Goals */}
        <EmployeeGoals goals={mockGoals} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <EmployeeNotifications notifications={employeeNotifs} />

        {/* Recent Payslips */}
        <EmployeePayslips payslips={mockPayslips} />
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