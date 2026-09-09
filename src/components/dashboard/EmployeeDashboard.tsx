'use client';

import React, { useState } from 'react';
import { Clock, CalendarDays, DollarSign, TrendingUp, FileText, Send, CheckCircle2, LogIn, LogOut, AlertCircle } from 'lucide-react';
import Card from '../ui/Card';
import StatCard from '../ui/StatCard';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { mockLeaveBalances, mockPayslips, mockGoals } from '../../lib/mock-data';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import Link from 'next/link';

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

  return (
    <div className="space-y-6">
      {/* Welcome + Check In/Out */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#17324D]">Welcome, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
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
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Working Days"
          value="22/23"
          icon={<Clock size={22} className="text-[#0F8B8D]" />}
          iconBg="bg-[#EAF2F4]"
          change="This month"
        />
        <StatCard
          title="Leave Balance"
          value={`${mockLeaveBalances.reduce((sum, lb) => sum + lb.remaining, 0)} days`}
          icon={<CalendarDays size={22} className="text-orange-500" />}
          iconBg="bg-orange-50"
          change="Across all types"
        />
        <StatCard
          title="Last Payslip"
          value={`$${mockPayslips[0]?.netSalary.toLocaleString() || '0'}`}
          icon={<DollarSign size={22} className="text-green-600" />}
          iconBg="bg-green-50"
          change={mockPayslips[0] ? `${mockPayslips[0].month} ${mockPayslips[0].year}` : ''}
        />
        <StatCard
          title="Goals Progress"
          value={`${mockGoals.filter(g => g.status === 'Completed').length}/${mockGoals.length}`}
          icon={<TrendingUp size={22} className="text-purple-600" />}
          iconBg="bg-purple-50"
          change="Completed"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leave Balances */}
        <Card className="lg:col-span-2">
          <h3 className="text-base font-semibold text-[#17324D] mb-4">Leave Balances</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {mockLeaveBalances.map(balance => (
              <div key={balance.leaveType} className="p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#263238]">{balance.leaveType}</span>
                  <Badge variant={balance.remaining > 5 ? 'success' : balance.remaining > 0 ? 'warning' : 'danger'} size="sm">
                    {balance.remaining} left
                  </Badge>
                </div>
                <div className="w-full bg-[#D6E4E8] rounded-full h-2 mb-2">
                  <div
                    className="bg-[#0F8B8D] h-2 rounded-full transition-all"
                    style={{ width: `${(balance.used / balance.total) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Used: {balance.used}</span>
                  <span>Total: {balance.total}</span>
                </div>
                {balance.pending > 0 && (
                  <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                    <AlertCircle size={12} /> {balance.pending} pending approval
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm">
              <Send size={14} /> Request Leave
            </Button>
          </div>
        </Card>

        {/* Notifications */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#17324D]">Notifications</h3>
            <Link href="/notifications" className="text-sm text-[#0F8B8D] hover:underline font-medium">View All</Link>
          </div>
          <div className="space-y-3">
            {employeeNotifs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No new notifications</p>
            ) : (
              employeeNotifs.map(notif => (
                <div key={notif.id} className="p-3 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
                  <p className="text-sm font-medium text-[#263238]">{notif.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{notif.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Goals */}
        <Card>
          <h3 className="text-base font-semibold text-[#17324D] mb-4">My Goals</h3>
          <div className="space-y-4">
            {mockGoals.map(goal => (
              <div key={goal.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#263238]">{goal.title}</span>
                  <Badge
                    variant={goal.status === 'Completed' ? 'success' : goal.status === 'In Progress' ? 'info' : 'neutral'}
                    size="sm"
                  >
                    {goal.status}
                  </Badge>
                </div>
                <div className="w-full bg-[#D6E4E8] rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      goal.progress >= 75 ? 'bg-green-500' : goal.progress >= 50 ? 'bg-[#0F8B8D]' : 'bg-orange-400'
                    }`}
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{goal.progress}% complete</span>
                  <span>Due: {goal.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Payslips */}
        <Card>
          <h3 className="text-base font-semibold text-[#17324D] mb-4">Recent Payslips</h3>
          <div className="space-y-3">
            {mockPayslips.slice(0, 3).map(slip => (
              <div key={slip.id} className="flex items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <FileText size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#263238]">{slip.month} {slip.year}</p>
                    <p className="text-xs text-gray-500">Generated: {slip.generatedOn}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#17324D]">${slip.netSalary.toLocaleString()}</p>
                  <Badge variant="success" size="sm">Paid</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
