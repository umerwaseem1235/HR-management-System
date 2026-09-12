'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarOff, ClipboardCheck, Gift, Clock, CheckCircle2, XCircle, ArrowUpRight, Briefcase, UserPlus, DollarSign, TrendingUp, ChevronDown } from 'lucide-react';
import Card from '../ui/Card';
import StatCard from '../ui/StatCard';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import AttendanceChart, { TrendPoint } from './AttendanceChart';
import { useAuth } from '../../contexts/AuthContext';
import { mockDashboardStats, mockLeaveRequests, mockNotifications, mockEmployees, mockAttendance } from '../../lib/mock-data';

export default function AdminDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const stats = mockDashboardStats;
  const pendingLeaves = mockLeaveRequests.filter(l => l.status === 'Pending');

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
    { name: 'Engineering', count: 5, color: 'bg-[#2563eb]' },
    { name: 'Human Resources', count: 2, color: 'bg-[#2378bd]' },
    { name: 'Marketing', count: 1, color: 'bg-[#3ecf8e]' },
    { name: 'Sales', count: 1, color: 'bg-[#8b5cf6]' },
    { name: 'Finance', count: 1, color: 'bg-[#6f8ff5]' },
    { name: 'Design', count: 1, color: 'bg-[#dd6bab]' },
    { name: 'Product', count: 1, color: 'bg-indigo-500' },
    { name: 'Customer Support', count: 1, color: 'bg-yellow-500' },
    { name: 'Operations', count: 1, color: 'bg-emerald-500' },
    { name: 'Legal', count: 1, color: 'bg-red-500' },
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="mt-1.5 text-2xl font-bold leading-tight tracking-tight text-[#17324D]">
            Welcome back, {welcomeName}!
          </h1>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D6E4E8]/70 bg-white px-4 py-2 shadow-[0_1px_2px_rgba(23,50,77,0.05),0_10px_30px_-14px_rgba(23,50,77,0.18)]">
          <span className="text-[13px] font-semibold text-[#17324D]">{todayLabel}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          iconName="totalEmployees"
          iconColor="#024fa7"
          iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          iconName="presentToday"
          iconColor="#024fa7"
          iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]"
        />
        <StatCard
          title="Absent Today"
          value={stats.absentToday}
          iconName="absentToday"
          iconColor="#024fa7"
          iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]"
        />
        <StatCard
          title="On Leave Today"
          value={stats.onLeaveToday}
          iconName="onLeaveToday"
          iconColor="#024fa7"
          iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]"
        />
        <StatCard
          title="Approvals"
          value={stats.pendingLeaveApprovals + stats.pendingExpenseApprovals}
          iconName="activity"
          iconColor="#024fa7"
          iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]"
        />
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card padding="sm" hover>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Briefcase size={18} className="text-[#024fa7]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#17324D]">{stats.openVacancies}</p>
              <p className="text-xs text-gray-500">Open Vacancies</p>
            </div>
          </div>
        </Card>
        <Card padding="sm" hover>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <UserPlus size={18} className="text-[#024fa7]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#17324D]">{stats.newJoinersThisMonth}</p>
              <p className="text-xs text-gray-500">New Joiners</p>
            </div>
          </div>
        </Card>
        <Card padding="sm" hover>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <Clock size={18} className="text-[#024fa7]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#17324D]">{stats.lateToday}</p>
              <p className="text-xs text-gray-500">Late Today</p>
            </div>
          </div>
        </Card>
        <Card padding="sm" hover>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <DollarSign size={18} className="text-[#024fa7]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#17324D]">{stats.payrollStatus}</p>
              <p className="text-xs text-gray-500">Payroll Status</p>
            </div>
          </div>
        </Card>
        <Card padding="sm" hover>
          <div className="flex items-center gap-3">
            <div className="bg-blue-50 p-2 rounded-lg">
              <ClipboardCheck size={18} className="text-[#024fa7]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#17324D]">{stats.attendanceRate}%</p>
              <p className="text-xs text-gray-500">Attendance Rate</p>
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
            <div className="relative">
              <select
                value={trendRange}
                onChange={(e) => setTrendRange(e.target.value as 'week' | 'month')}
                className="appearance-none rounded-full border border-[#D6E4E8] bg-white pl-3.5 pr-9 py-1.5 text-xs font-semibold text-[#263238] focus:border-[#024fa7] focus:outline-none cursor-pointer"
              >
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" />
            </div>
          </div>
          <AttendanceChart key={trendRange} data={trendData} />
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
                    <button className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 transition-colors">
                      <CheckCircle2 size={18} />
                    </button>
                    <button className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Headcount */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[#17324D]">Department Headcount</h3>
            <Badge variant="default">{stats.totalEmployees} Total</Badge>
          </div>
          <div className="space-y-3">
            {deptCounts.slice(0, 6).map(dept => (
              <div key={dept.name} className="flex items-center gap-3">
                <span className="text-sm text-[#263238] w-32 truncate">{dept.name}</span>
                <div className="flex-1 bg-[#EAF2F4] rounded-full h-6 relative overflow-hidden">
                  <div
                    className={`${dept.color} h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2`}
                    style={{ width: `${(dept.count / maxDeptCount) * 100}%`, minWidth: '32px' }}
                  >
                    <span className="text-xs font-semibold text-white">{dept.count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <h3 className="text-base font-semibold text-[#17324D] mb-4">Upcoming Events</h3>
          <div className="space-y-3">
            {upcomingEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#EAF2F4]/50 transition-colors">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                  event.type === 'birthday' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <event.icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#263238] truncate">{event.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{event.type === 'birthday' ? '🎂 Birthday' : event.type === 'anniversary' ? '🎉 Anniversary' : '📋 Probation End'}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{event.date}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

    </div>
  );
}
