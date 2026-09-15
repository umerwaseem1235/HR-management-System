'use client';

import React, { useState } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import Button from '../ui/Button';
import PageHeader from '../ui/PageHeader';
import EmployeeStats from './employee/EmployeeStats';
import EmployeeLeaveBalances from './employee/EmployeeLeaveBalances';
import EmployeeGoals from './employee/EmployeeGoals';
import EmployeeNotifications from './employee/EmployeeNotifications';
import EmployeePayslips from './employee/EmployeePayslips';
import { mockLeaveBalances, mockPayslips, mockGoals } from '../../lib/mock-data';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);

  const handleCheckIn = () => {
    const now = new Date();
    setCheckInTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    setCheckedIn(true);
  };

  const handleCheckOut = () => {
    setCheckedIn(false);
    setCheckInTime(null);
  };

  const { notifications } = useNotifications();

  const employeeNotifs = notifications.filter(n => !n.read).slice(0, 3);

  const visibleLeaveBalances = mockLeaveBalances.filter(
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
              <Button variant="primary" onClick={handleCheckIn}>
                <LogIn size={16} /> Check In
              </Button>
            ) : (
              <Button variant="danger" onClick={handleCheckOut}>
                <LogOut size={16} /> Check Out
              </Button>
            )}
          </>
        }
      />

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
    </div>
  );
}
