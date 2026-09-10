'use client';

import React from 'react';
import { CalendarOff, CalendarDays, ClipboardCheck, Gift, Clock, CheckCircle2, XCircle, ArrowUpRight, Briefcase, UserPlus, DollarSign, TrendingUp } from 'lucide-react';
import Card from '../ui/Card';
import StatCard from '../ui/StatCard';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import { mockDashboardStats, mockLeaveRequests, mockNotifications, mockEmployees, mockAttendance } from '../../lib/mock-data';

export default function AdminDashboard() {
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

  // Department headcount
  const deptCounts = [
    { name: 'Engineering', count: 5, color: 'bg-[#0F8B8D]' },
    { name: 'Human Resources', count: 2, color: 'bg-[#17324D]' },
    { name: 'Marketing', count: 1, color: 'bg-orange-500' },
    { name: 'Sales', count: 1, color: 'bg-blue-500' },
    { name: 'Finance', count: 1, color: 'bg-purple-500' },
    { name: 'Design', count: 1, color: 'bg-pink-500' },
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

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0F8B8D]">Admin Overview</p>
          <h1 className="mt-1.5 text-[30px] font-extrabold leading-tight tracking-tight text-[#17324D]">
            {greeting}! <span className="animate-wave">👋</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">Here&apos;s what&apos;s happening in your organization today.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D6E4E8]/70 bg-white px-4 py-2 shadow-[0_1px_2px_rgba(23,50,77,0.05),0_10px_30px_-14px_rgba(23,50,77,0.18)]">
          <CalendarDays size={15} className="text-[#0F8B8D]" />
          <span className="text-[13px] font-semibold text-[#17324D]">{todayLabel}</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          iconName="totalEmployees"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          iconName="presentToday"
          iconBg="bg-gradient-to-br from-green-50 to-emerald-50"
        />
        <StatCard
          title="Absent Today"
          value={stats.absentToday}
          iconName="absentToday"
          iconBg="bg-gradient-to-br from-red-50 to-rose-50"
        />
        <StatCard
          title="On Leave Today"
          value={stats.onLeaveToday}
          iconName="onLeaveToday"
          iconBg="bg-gradient-to-br from-orange-50 to-amber-50"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingLeaveApprovals + stats.pendingExpenseApprovals}
          iconName="activity"
          iconBg="bg-gradient-to-br from-[#EAF2F4] to-[#D6E4E8]"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-[#17324D]">Attendance Trend</h3>
            <Badge variant="default">This Week</Badge>
          </div>
          <div className="flex items-end justify-between gap-2 h-48">
            {attendanceTrend.map(day => (
              <div key={day.day} className="flex flex-col items-center flex-1 gap-2">
                <span className="text-xs font-medium text-[#17324D]">{day.present}</span>
                <div className="w-full bg-[#EAF2F4] rounded-t-md relative" style={{ height: '140px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-[#0F8B8D] rounded-t-md transition-all duration-500"
                    style={{ height: `${day.total > 0 ? (day.present / day.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">{day.day}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Department Headcount */}
        <Card>
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
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Leave Approvals */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-[#17324D]">Pending Leave Approvals</h3>
            <button className="text-sm text-[#0F8B8D] hover:underline font-medium flex items-center gap-1">
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

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="sm" hover>
          <div className="flex items-center gap-3">
            <div className="bg-green-50 p-2 rounded-lg">
              <Briefcase size={18} className="text-green-600" />
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
              <UserPlus size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#17324D]">{stats.newJoinersThisMonth}</p>
              <p className="text-xs text-gray-500">New Joiners</p>
            </div>
          </div>
        </Card>
        <Card padding="sm" hover>
          <div className="flex items-center gap-3">
            <div className="bg-orange-50 p-2 rounded-lg">
              <Clock size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#17324D]">{stats.lateToday}</p>
              <p className="text-xs text-gray-500">Late Today</p>
            </div>
          </div>
        </Card>
        <Card padding="sm" hover>
          <div className="flex items-center gap-3">
            <div className="bg-[#EAF2F4] p-2 rounded-lg">
              <DollarSign size={18} className="text-[#0F8B8D]" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#17324D]">{stats.payrollStatus}</p>
              <p className="text-xs text-gray-500">Payroll Status</p>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
