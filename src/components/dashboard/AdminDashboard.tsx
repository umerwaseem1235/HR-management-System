'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Gift } from 'lucide-react';
import AdminHeader from './admin/AdminHeader';
import AdminStats from './admin/AdminStats';
import AdminCharts from './admin/AdminCharts';
import { DepartmentHeadcountCard, PendingLeavesCard, UpcomingEventsCard } from './admin/AdminTables';
import type { DepartmentCount, TrendPoint, UpcomingEvent } from './dashboard-types';
import { useAuth } from '../../contexts/AuthContext';
import { mockDashboardStats, mockLeaveRequests } from '../../lib/mock-data';

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
  const deptCounts: DepartmentCount[] = [
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

  const upcomingEvents: UpcomingEvent[] = [
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

      {/* Stat Cards + Quick Stats Row */}
      <AdminStats stats={stats} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <AdminCharts range={trendRange} onRangeChange={setTrendRange} data={trendData} />

        {/* Pending Leave Approvals */}
        <PendingLeavesCard leaves={pendingLeaves} onViewAll={() => router.push('/leave')} />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Headcount */}
        <DepartmentHeadcountCard
          departments={deptCounts}
          maxCount={maxDeptCount}
          totalEmployees={stats.totalEmployees}
        />

        {/* Upcoming Events */}
        <UpcomingEventsCard events={upcomingEvents} />
      </div>

    </div>
  );
}
