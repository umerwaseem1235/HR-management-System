'use client';

import { Briefcase, ClipboardCheck, Clock, DollarSign, UserPlus } from 'lucide-react';
import DashboardStatsGrid from '../widgets/DashboardStatsGrid';
import QuickStatsRow from '../widgets/QuickStatsRow';
import type { DashboardStats, QuickStatItem, StatGridItem } from '../dashboard-types';

const STAT_ICON_BG = 'bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]';
const STAT_ICON_COLOR = '#024fa7';

export default function AdminStats({ stats }: { stats: DashboardStats }) {
  const statItems: StatGridItem[] = [
    { title: 'Total Employees', value: stats.totalEmployees, iconName: 'totalEmployees', iconColor: STAT_ICON_COLOR, iconBg: STAT_ICON_BG },
    { title: 'Present Today', value: stats.presentToday, iconName: 'presentToday', iconColor: STAT_ICON_COLOR, iconBg: STAT_ICON_BG },
    { title: 'Absent Today', value: stats.absentToday, iconName: 'absentToday', iconColor: STAT_ICON_COLOR, iconBg: STAT_ICON_BG },
    { title: 'On Leave Today', value: stats.onLeaveToday, iconName: 'onLeaveToday', iconColor: STAT_ICON_COLOR, iconBg: STAT_ICON_BG },
    { title: 'Approvals', value: stats.pendingLeaveApprovals + stats.pendingExpenseApprovals, iconName: 'activity', iconColor: STAT_ICON_COLOR, iconBg: STAT_ICON_BG },
  ];

  const quickItems: QuickStatItem[] = [
    { icon: Briefcase, value: stats.openVacancies, label: 'Open Vacancies' },
    { icon: UserPlus, value: stats.newJoinersThisMonth, label: 'New Joiners' },
    { icon: Clock, value: stats.lateToday, label: 'Late Today' },
    { icon: DollarSign, value: stats.payrollStatus, label: 'Payroll Status' },
    { icon: ClipboardCheck, value: `${stats.attendanceRate}%`, label: 'Attendance Rate' },
  ];

  return (
    <>
      {/* Stat Cards - responsive: wraps when sidebar is open / narrow screens */}
      <DashboardStatsGrid items={statItems} itemWrapperClassName="min-w-0" />
      {/* Quick Stats Row - responsive: wraps when sidebar is open / narrow screens */}
      <QuickStatsRow items={quickItems} />
    </>
  );
}
