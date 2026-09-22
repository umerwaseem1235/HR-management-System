'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';
import EmployeeStats from './employee/EmployeeStats';
import EmployeeLeaveBalances from './employee/EmployeeLeaveBalances';
import EmployeeGoals from './employee/EmployeeGoals';
import EmployeeNotifications from './employee/EmployeeNotifications';
import EmployeePayslips from './employee/EmployeePayslips';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useEmployeeDirectory } from '../../hooks/useEmployeeDirectory';
import { getLeaveBalances } from '../../lib/actions/leave';
import { getPayslips } from '../../lib/actions/payroll';
import { getGoals } from '../../lib/actions/performance';
import { getAttendanceByDate, selfCheckInOut } from '../../lib/actions/attendance';
import type { Goal, LeaveBalance, Payslip } from '../../lib/types';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { findByUser } = useEmployeeDirectory();
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [slips, setSlips] = useState<Payslip[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkedOut, setCheckedOut] = useState(false);
  const [busy, setBusy] = useState(false);

  const employee = useMemo(() => findByUser(user), [findByUser, user]);
  const checkedIn = !!checkInTime && !checkedOut;

  const refreshToday = async (empId: string, date: string) => {
    const rows = await getAttendanceByDate(date);
    const mine = rows.find((r) => r.employeeId === empId);
    setCheckInTime(mine?.checkIn || null);
    setCheckedOut(!!mine?.checkOut);
  };

  useEffect(() => {
    if (!employee) return;
    let cancelled = false;
    (async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [b, s, g] = await Promise.all([
          getLeaveBalances(employee.id),
          getPayslips(employee.id),
          getGoals(employee.id),
        ]);
        if (cancelled) return;
        setBalances(b);
        setSlips(s);
        setGoals(g);
        await refreshToday(employee.id, today);
      } catch (err) {
        console.error('Failed to load employee dashboard:', err);
      }
    })();
    return () => { cancelled = true; };
  }, [employee?.id]);

  const handleCheckIn = async () => {
    if (!employee || busy) return;
    setBusy(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const rec = await selfCheckInOut(employee.id, today, 'check_in');
      setCheckInTime(rec.checkIn || null);
      setCheckedOut(false);
    } catch (err) {
      console.error('Check-in failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleCheckOut = async () => {
    if (!employee || busy) return;
    setBusy(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      await selfCheckInOut(employee.id, today, 'check_out');
      await refreshToday(employee.id, today);
    } catch (err) {
      console.error('Check-out failed:', err);
    } finally {
      setBusy(false);
    }
  };

  const { notifications } = useNotifications();

  const employeeNotifs = notifications.filter(n => !n.read).slice(0, 3);

  const visibleLeaveBalances = balances.filter(
    (lb) => lb.leaveType !== 'Maternity Leave' && lb.leaveType !== 'Paternity Leave'
  );

  return (
    <div className="space-y-6">
      {/* Welcome + Check In/Out */}
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0]}! 👋`}
        actions={
          <>
            {checkInTime && (
              <span className="text-sm text-gray-500">Checked in at {checkInTime}</span>
            )}
            {!checkedIn ? (
              <Button variant="primary" onClick={handleCheckIn} disabled={busy} loading={busy}>
                <LogIn size={16} /> Check In
              </Button>
            ) : (
              <Button variant="danger" onClick={handleCheckOut} disabled={busy} loading={busy}>
                <LogOut size={16} /> Check Out
              </Button>
            )}
          </>
        }
      />

      {/* Quick Stats */}
      <EmployeeStats
        leaveRemainingTotal={visibleLeaveBalances.reduce((sum, lb) => sum + lb.remaining, 0)}
        lastPayslipNet={slips[0]?.netSalary || 0}
        goalsCompleted={goals.filter(g => g.status === 'Completed').length}
        goalsTotal={goals.length}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        {/* Leave Balances */}
        <EmployeeLeaveBalances balances={visibleLeaveBalances} />

        {/* My Goals */}
        <EmployeeGoals goals={goals} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications */}
        <EmployeeNotifications notifications={employeeNotifs} />

        {/* Recent Payslips */}
        <EmployeePayslips payslips={slips} />
      </div>
    </div>
  );
}