'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardCheck, Gift, Clock, CheckCircle2, XCircle, ArrowUpRight, Briefcase, UserPlus, DollarSign } from 'lucide-react';
import Card from '../ui/Card';
import StatCard from '../ui/StatCard';
import Avatar from '../ui/Avatar';
import ConfirmDialog from '../ui/ConfirmDialog';
import AttendanceChart, { TrendPoint } from './AttendanceChart';
import AdminHeader from './admin/AdminHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useLeave } from '../../contexts/LeaveContext';
import { useDashboard } from '../../contexts/DashboardContext';
import type { DashboardStats, LeaveRequest } from '../../lib/types';
import type { DashboardEmployee } from '../../lib/actions/dashboard';

const EMPTY_EMPLOYEES: DashboardEmployee[] = [];

const DEPT_PALETTE = [
  { color: 'bg-[#2563eb]', fill: 'linear-gradient(90deg, #2E7CCB 0%, #0B4EA2 100%)' },
  { color: 'bg-[#2378bd]', fill: 'linear-gradient(90deg, #3494CB 0%, #1B66AC 100%)' },
  { color: 'bg-[#3ecf8e]', fill: 'linear-gradient(90deg, #62D89B 0%, #38BC7E 100%)' },
  { color: 'bg-[#8b5cf6]', fill: 'linear-gradient(90deg, #9B7BFF 0%, #7B4DFF 100%)' },
  { color: 'bg-[#6f8ff5]', fill: 'linear-gradient(90deg, #6E92D7 0%, #4E6FC2 100%)' },
  { color: 'bg-[#dd6bab]', fill: 'linear-gradient(90deg, #DE7EB3 0%, #C65B9A 100%)' },
  { color: 'bg-indigo-500', fill: 'linear-gradient(90deg, #818CF8 0%, #6366F1 100%)' },
  { color: 'bg-yellow-500', fill: 'linear-gradient(90deg, #FBBF24 0%, #F59E0B 100%)' },
  { color: 'bg-emerald-500', fill: 'linear-gradient(90deg, #34D399 0%, #059669 100%)' },
  { color: 'bg-red-500', fill: 'linear-gradient(90deg, #F87171 0%, #EF4444 100%)' },
];

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { leaveRequests, updateLeaveStatus } = useLeave();
  // Cached at the app root: switching modules and coming back is instant and
  // does not re-run the dashboard query.
  const { data, ensureLoaded } = useDashboard();
  const employees = data?.employees ?? EMPTY_EMPLOYEES;
  const stats = data?.stats ?? null;
  const trendWeek = useMemo(() => data?.attendanceTrend.slice(-7) ?? [], [data]);
  // Month view: current month elapsed days only
  const trendMonth = useMemo(() => {
    const prefix = new Date().toISOString().slice(0, 7);
    return (data?.attendanceTrend ?? []).filter((d) => d.date.startsWith(prefix));
  }, [data]);
  const pendingLeaves = leaveRequests.filter(l => l.status === 'Pending');
  // Payroll label comes from the single dashboard query (same Pending/In Process/Finalized semantics as payroll page).
  const payrollStatusValue = stats?.payrollStatus ?? 'Pending';
  const [confirmApproveLeave, setConfirmApproveLeave] = useState<LeaveRequest | null>(null);
  const [confirmRejectLeave, setConfirmRejectLeave] = useState<LeaveRequest | null>(null);

  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);

  const [trendRange, setTrendRange] = useState<'week' | 'month'>('week');

  // Zeroed stats until the live numbers arrive (avoids null crashes)
  const s: DashboardStats = stats ?? {
    totalEmployees: 0,
    activeEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    onLeaveToday: 0,
    lateToday: 0,
    pendingLeaveApprovals: 0,
    pendingExpenseApprovals: 0,
    openVacancies: 0,
    newJoinersThisMonth: 0,
    upcomingExits: 0,
    payrollStatus: 'Pending',
    attendanceRate: 0,
  };

  const trendData: TrendPoint[] = useMemo(() => {
    const src = trendRange === 'week' ? trendWeek : trendMonth;
    return src.map((d) => ({
      label: trendRange === 'week' ? d.label : d.date.slice(8),
      fullLabel: d.fullLabel,
      value: d.present,
    }));
  }, [trendRange, trendWeek, trendMonth]);

  // Department headcount from live employees
  const deptCounts = useMemo(() => {
    const counts = new Map<string, number>();
    employees.forEach((e) => {
      const name = e.department || 'Unassigned';
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return [...counts.entries()]
      .map(([name, count], i) => ({ name, count, ...DEPT_PALETTE[i % DEPT_PALETTE.length] }))
      .sort((a, b) => b.count - a.count);
  }, [employees]);
  const maxDeptCount = Math.max(1, ...deptCounts.map((d) => d.count));

  // Upcoming events from live data: birthdays + probation endings in next 30 days
  const upcomingEvents = useMemo(() => {
    const out: { type: string; name: string; date: string; icon: typeof Gift }[] = [];
    const now = new Date();
    const in30 = new Date();
    in30.setDate(in30.getDate() + 30);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    employees.forEach((e) => {
      const fullName = `${e.firstName} ${e.lastName}`;
      if (e.dateOfBirth) {
        const parts = e.dateOfBirth.split('-').map(Number);
        const m = parts[1];
        const d = parts[2];
        if (m && d) {
          const next = new Date(now.getFullYear(), m - 1, d);
          if (next < now) next.setFullYear(next.getFullYear() + 1);
          if (next <= in30) out.push({ type: 'birthday', name: fullName, date: fmt(next), icon: Gift });
        }
      }
      if (e.probationEndDate) {
        const prob = new Date(`${e.probationEndDate}T00:00:00`);
        if (prob >= now && prob <= in30) {
          out.push({ type: 'probation', name: fullName, date: fmt(prob), icon: Clock });
        }
      }
    });
    return out.slice(0, 6);
  }, [employees]);

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
            value={s.totalEmployees}
            iconName="totalEmployees"
            iconColor="#024fa7"
            iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]"
          />
        </div>
        <div className="min-w-0">
          <StatCard
            title="Present Today"
            value={s.presentToday}
            iconName="presentToday"
            iconColor="#024fa7"
            iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]"
          />
        </div>
        <div className="min-w-0">
          <StatCard
            title="Absent Today"
            value={s.absentToday}
            iconName="absentToday"
            iconColor="#024fa7"
            iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]"
          />
        </div>
        <div className="min-w-0">
          <StatCard
            title="On Leave Today"
            value={s.onLeaveToday}
            iconName="onLeaveToday"
            iconColor="#024fa7"
            iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]"
          />
        </div>
        <div className="min-w-0">
          <StatCard
            title="Approvals"
            value={s.pendingLeaveApprovals + s.pendingExpenseApprovals}
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
              <p className="text-base xl:text-lg font-bold leading-tight text-[#17324D]">{s.openVacancies}</p>
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
              <p className="text-base xl:text-lg font-bold leading-tight text-[#17324D]">{s.newJoinersThisMonth}</p>
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
              <p className="text-base xl:text-lg font-bold leading-tight text-[#17324D]">{s.lateToday}</p>
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
              <p className="text-base xl:text-lg font-bold leading-tight text-[#17324D]">{s.attendanceRate}%</p>
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
              {s.totalEmployees} Total
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