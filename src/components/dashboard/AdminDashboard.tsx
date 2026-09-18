'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarOff, ClipboardCheck, Gift, Clock, CheckCircle2, XCircle, ArrowUpRight, Briefcase, UserPlus, DollarSign, TrendingUp, ChevronDown } from 'lucide-react';
import Card from '../ui/Card';
import StatCard from '../ui/StatCard';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import ConfirmDialog from '../ui/ConfirmDialog';
import AttendanceChart, { TrendPoint } from './AttendanceChart';
import AdminHeader from './admin/AdminHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useLeave } from '../../contexts/LeaveContext';
import type { LeaveRequest } from '../../lib/types';
import type { PayrollRun } from '../../lib/payroll';
import { getPayrollStatus, loadPayrollRuns, seedDecember2023Run } from '../../lib/payroll';
import { mockDashboardStats, mockNotifications, mockEmployees, mockAttendance, mockPayslips } from '../../lib/mock-data';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { leaveRequests, updateLeaveStatus } = useLeave();
  const stats = mockDashboardStats;
  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending');
  // Same live payroll status as the payroll page (persisted runs, newest first)
  const [payrollRuns] = useState<PayrollRun[]>(() => loadPayrollRuns(() => [seedDecember2023Run(mockPayslips)]));
  const payrollStatusValue = getPayrollStatus(payrollRuns);
  const [confirmApproveLeave, setConfirmApproveLeave] = useState<LeaveRequest | null>(null);
  const [confirmRejectLeave, setConfirmRejectLeave] = useState<LeaveRequest | null>(null);

  // Attendance trend data (mock 7 days)
  const attendanceTrend = [
    { day: 'Mon', present: 11, total: 15 },
    { day: 'Tue', present: 13, total: 15 },
    { day: 'Wed', present: 12, total: 15 },
    { day: 'Thu', present: 14, total: 15 },
    { day: 'Fri', present: 10, total: 15 },
    { day: 'Sat', present: 0, total: 15 },
    { day: 'Sun', present: 0, total: 15 },
  ];
  const fullDayNames: Record<string, string> = {
    Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
    Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
  };

  const [trendRange, setTrendRange] = useState<'week' | 'month'>('week');

  const trendData: TrendPoint[] = useMemo(() => {
    if (trendRange === 'week') {
      return attendanceTrend.map((d) => ({
        label: d.day,
        fullLabel: fullDayNames[d.day] ?? d.day,
        value: d.present,
      }));
    }
    // Deterministic mock series for the current month up to today
    const now = new Date();
    const elapsed = now.getDate();
    const monthName = now.toLocaleDateString('en-US', { month: 'short' });
    return Array.from({ length: elapsed }, (_, i) => {
      const day = i + 1;
      const date = new Date(now.getFullYear(), now.getMonth(), day);
      const weekday = date.getDay();
      if (weekday === 0 || weekday === 6) {
        return { label: String(day), fullLabel: `${monthName} ${day}`, value: 0 };
      }
      const value = Math.max(
        0,
        Math.min(
          15,
          Math.round(15 * (0.62 + 0.3 * Math.abs(Math.sin(day * 1.35)) + 0.08 * Math.sin(day * 0.6)))
        )
      );
      return { label: String(day), fullLabel: `${monthName} ${day}`, value };
    });
  }, [trendRange]);

  // Department headcount
  const deptCounts = [
    { name: 'Engineering', count: 5, color: 'bg-[#2563eb]', fill: 'linear-gradient(90deg, #2E7CCB 0%, #0B4EA2 100%)' },
    { name: 'Human Resources', count: 2, color: 'bg-[#2378bd]', fill: 'linear-gradient(90deg, #3494CB 0%, #1B66AC 100%)' },
    { name: 'Marketing', count: 1, color: 'bg-[#3ecf8e]', fill: 'linear-gradient(90deg, #62D89B 0%, #38BC7E 100%)' },
    { name: 'Sales', count: 1, color: 'bg-[#8b5cf6]', fill: 'linear-gradient(90deg, #9B7BFF 0%, #7B4DFF 100%)' },
    { name: 'Finance', count: 1, color: 'bg-[#6f8ff5]', fill: 'linear-gradient(90deg, #6E92D7 0%, #4E6FC2 100%)' },
    { name: 'Design', count: 1, color: 'bg-[#dd6bab]', fill: 'linear-gradient(90deg, #DE7EB3 0%, #C65B9A 100%)' },
    { name: 'Product', count: 1, color: 'bg-indigo-500', fill: 'linear-gradient(90deg, #818CF8 0%, #6366F1 100%)' },
    { name: 'Customer Support', count: 1, color: 'bg-yellow-500', fill: 'linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%)' },
    { name: 'Operations', count: 1, color: 'bg-emerald-500', fill: 'linear-gradient(90deg, #34D399 0%, #059669 100%)' },
    { name: 'Legal', count: 1, color: 'bg-red-500', fill: 'linear-gradient(90deg, #F87171 0%, #EF4444 100%)' },
  ];
  const maxDeptCount = Math.max(...deptCounts.map(d => d.count));

  const upcomingEvents = [
    { type: 'birthday', name: 'Ahmed Hassan', date: 'Tomorrow', icon: Gift },
    { type: 'anniversary', name: 'Sarah Williams', date: 'Jan 15', icon: Gift },
    { type: 'probation', name: 'Priya Sharma', date: 'Feb 01', icon: Clock },
    { type: 'probation', name: 'Emma Garcia', date: 'Apr 08', icon: Clock },
  ];

  const welcomeName = user?.role === 'super_admin' ? 'Admin' : (user?.name?.split(' ')[0] ?? 'Admin');
  const todayDate = new Date();
  const todayLabel = `${todayDate.toLocaleDateString('en-GB')}, ${todayDate.toLocaleDateString('en-US', { weekday: 'short' })}`;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <AdminHeader welcomeName={welcomeName} todayLabel={todayLabel} />

      {/* Stat Cards - responsive: wraps when sidebar is open / narrow screens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 2xl:gap-4">
        <div className="min-w-0">
          <StatCard
            title="Total Employees"
            value={stats.totalEmployees}
            iconName="totalEmployees"
            iconColor="#024fa7"
            iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]"
          />
        </div>
        <div className="min-w-0">
          <StatCard
            title="Present Today"
            value={stats.presentToday}
            iconName="presentToday"
            iconColor="#024fa7"
            iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]"
          />
        </div>
        <div className="min-w-0">
          <StatCard
            title="Absent Today"
            value={stats.absentToday}
            iconName="absentToday"
            iconColor="#024fa7"
            iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]"
          />
        </div>
        <div className="min-w-0">
          <StatCard
            title="On Leave Today"
            value={stats.onLeaveToday}
            iconName="onLeaveToday"
            iconColor="#024fa7"
            iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]"
          />
        </div>
        <div className="min-w-0">
          <StatCard
            title="Approvals"
            value={stats.pendingLeaveApprovals + stats.pendingExpenseApprovals}
            iconName="activity"
            iconColor="#024fa7"
            iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]"
          />
        </div>
      </div>

      {/* Quick Stats Row - responsive: wraps when sidebar is open / narrow screens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 2xl:gap-4">
        <Card padding="none" hover className="min-w-0 overflow-hidden p-3 xl:p-4">
          <div className="flex items-center gap-2 xl:gap-3">
            <div className="shrink-0 bg-blue-50 p-2 rounded-lg">
              <Briefcase size={18} className="text-[#024fa7]" />
            </div>
            <div className="min-w-0">
              <p className="text-base xl:text-lg font-bold leading-tight text-[#17324D]">{stats.openVacancies}</p>
              <p className="truncate whitespace-nowrap text-[10px] xl:text-xs text-gray-500">Open Vacancies</p>
            </div>
          </div>
        </Card>
        <Card padding="none" hover className="min-w-0 overflow-hidden p-3 xl:p-4">
          <div className="flex items-center gap-2 xl:gap-3">
            <div className="shrink-0 bg-blue-50 p-2 rounded-lg">
              <UserPlus size={18} className="text-[#024fa7]" />
            </div>
            <div className="min-w-0">
              <p className="text-base xl:text-lg font-bold leading-tight text-[#17324D]">{stats.newJoinersThisMonth}</p>
              <p className="truncate whitespace-nowrap text-[10px] xl:text-xs text-gray-500">New Joiners</p>
            </div>
          </div>
        </Card>
        <Card padding="none" hover className="min-w-0 overflow-hidden p-3 xl:p-4">
          <div className="flex items-center gap-2 xl:gap-3">
            <div className="shrink-0 bg-blue-50 p-2 rounded-lg">
              <Clock size={18} className="text-[#024fa7]" />
            </div>
            <div className="min-w-0">
              <p className="text-base xl:text-lg font-bold leading-tight text-[#17324D]">{stats.lateToday}</p>
              <p className="truncate whitespace-nowrap text-[10px] xl:text-xs text-gray-500">Late Today</p>
            </div>
          </div>
        </Card>
        <Card padding="none" hover className="min-w-0 overflow-hidden p-3 xl:p-4">
          <div className="flex items-center gap-2 xl:gap-3">
            <div className="shrink-0 bg-blue-50 p-2 rounded-lg">
              <DollarSign size={18} className="text-[#024fa7]" />
            </div>
            <div className="min-w-0">
              <p className="text-base xl:text-lg font-bold leading-tight text-[#17324D]">{payrollStatusValue}</p>
              <p className="truncate whitespace-nowrap text-[10px] xl:text-xs text-gray-500">Payroll Status</p>
            </div>
          </div>
        </Card>
        <Card padding="none" hover className="min-w-0 overflow-hidden p-3 xl:p-4">
          <div className="flex items-center gap-2 xl:gap-3">
            <div className="shrink-0 bg-blue-50 p-2 rounded-lg">
              <ClipboardCheck size={18} className="text-[#024fa7]" />
            </div>
            <div className="min-w-0">
              <p className="text-base xl:text-lg font-bold leading-tight text-[#17324D]">{stats.attendanceRate}%</p>
              <p className="truncate whitespace-nowrap text-[10px] xl:text-xs text-gray-500">Attendance Rate</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#17324D]">Attendance Trend</h3>
            <div className="flex items-center gap-2">
              <select
                value={trendRange}
                onChange={(e) => setTrendRange(e.target.value as 'week' | 'month')}
                className="px-3 py-1.5 text-sm border border-[#D6E4E8] rounded-lg focus:border-[#024fa7] focus:ring-2 focus:ring-[#024fa7]/20 focus:outline-none"
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          </div>
          <AttendanceChart data={trendData} />
        </Card>

        {/* Pending Leave Approvals */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#17324D]">Pending Leave Approvals</h3>
            <button
              onClick={() => router.push('/leave')}
              className="text-sm text-[#024fa7] hover:underline font-medium flex items-center gap-1"
            >
              View All <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {pendingLeaves.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No pending approvals</p>
            ) : (
              pendingLeaves.map(leave => (
                <div key={leave.id} className="flex items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
                  <div className="flex items-center gap-3">
                    <Avatar name={leave.employeeName} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-[#263238]">{leave.employeeName}</p>
                      <p className="text-xs text-gray-500">
                        {leave.leaveType} · {leave.startDate} to {leave.endDate} · {leave.days} day{leave.days > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      title="Approve"
                      onClick={() => setConfirmApproveLeave(leave)}
                      className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors cursor-pointer"
                    >
                      <CheckCircle2 size={18} />
                    </button>
                    <button
                      title="Reject"
                      onClick={() => setConfirmRejectLeave(leave)}
                      className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors cursor-pointer"
                    >
                      <XCircle size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Department Headcount */}
        <Card className="lg:col-span-2 !rounded-2xl !p-5 h-full flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#EDF2FA]">
            <div className="flex items-center gap-2">
              <span className="w-1 h-6 rounded-full bg-[#0B5CAD]" />
              <h3 className="text-[17px] font-bold text-[#0B5CAD] tracking-tight">Department Headcount</h3>
            </div>
            <span className="rounded-full bg-[#E8F1FC] px-3 py-1 text-[13px] font-bold text-[#1A64B4] whitespace-nowrap">
              {stats.totalEmployees} Total
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-evenly">
            {deptCounts.slice(0, 6).map(dept => (
              <div key={dept.name} className="flex items-center gap-3 py-[7px] px-2 -mx-2 rounded-lg hover:bg-[#F5F9FD] transition-colors">
                <span className="w-28 sm:w-36 shrink-0 truncate text-[13px] font-medium text-[#3B4E64]">{dept.name}</span>
                <div className="flex-1 h-2 rounded-full bg-[#EDF2FA] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(dept.count / maxDeptCount) * 100}%`,
                      minWidth: '8px',
                      background: dept.fill,
                    }}
                  />
                </div>
                <span className="w-6 text-right text-[13px] font-bold tabular-nums text-[#17324D]">{dept.count}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card className="h-full flex flex-col">
          <h3 className="text-base font-semibold text-[#17324D] pb-3 mb-2 border-b border-[#EDF2FA]">Upcoming Events</h3>
          <div className="flex-1 flex flex-col justify-evenly space-y-2">
            {upcomingEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
                <div className="shrink-0 bg-blue-50 p-2 rounded-lg">
                  <event.icon size={18} className="text-[#024fa7]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#263238]">{event.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{event.type}</p>
                </div>
                <span className="text-xs text-gray-400 ml-auto">{event.date}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={!!confirmApproveLeave}
        onClose={() => setConfirmApproveLeave(null)}
        title="Approve Leave?"
        variant="approve"
        headline={
          <>
            Approve <span className="font-semibold text-[#17324D]">{confirmApproveLeave?.days} day{(confirmApproveLeave?.days ?? 1) > 1 ? 's' : ''} — {confirmApproveLeave?.leaveType}</span> for{' '}
            <span className="font-semibold text-[#17324D]">{confirmApproveLeave?.employeeName}</span>?
          </>
        }
        subline={confirmApproveLeave ? `${confirmApproveLeave.startDate} to ${confirmApproveLeave.endDate} · ${confirmApproveLeave.reason}` : undefined}
        note={
          <>
            This will mark the request as <span className="font-semibold text-green-700">Approved</span>. The employee&apos;s leave balance will be updated.
          </>
        }
        confirmLabel="Confirm Approve"
        confirmIcon={<CheckCircle2 size={16} />}
        onConfirm={() => {
          if (confirmApproveLeave) updateLeaveStatus(confirmApproveLeave.id, 'Approved', user?.name);
          setConfirmApproveLeave(null);
        }}
      />

      <ConfirmDialog
        isOpen={!!confirmRejectLeave}
        onClose={() => setConfirmRejectLeave(null)}
        title="Reject Leave?"
        variant="reject"
        headline={
          <>
            Reject <span className="font-semibold text-[#17324D]">{confirmRejectLeave?.days} day{(confirmRejectLeave?.days ?? 1) > 1 ? 's' : ''} — {confirmRejectLeave?.leaveType}</span> for{' '}
            <span className="font-semibold text-[#17324D]">{confirmRejectLeave?.employeeName}</span>?
          </>
        }
        subline={confirmRejectLeave ? `${confirmRejectLeave.startDate} to ${confirmRejectLeave.endDate} · ${confirmRejectLeave.reason}` : undefined}
        note={
          <>
            This will mark the request as <span className="font-semibold text-red-600">Rejected</span>. The employee will be able to see this status.
          </>
        }
        confirmLabel="Confirm Reject"
        confirmIcon={<XCircle size={16} />}
        onConfirm={() => {
          if (confirmRejectLeave) updateLeaveStatus(confirmRejectLeave.id, 'Rejected', user?.name);
          setConfirmRejectLeave(null);
        }}
      />

    </div>
  );
}