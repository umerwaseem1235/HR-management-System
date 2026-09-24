'use client';

import DashboardStatsGrid from '../widgets/DashboardStatsGrid';
import type { StatGridItem } from '../dashboard-types';

const STAT_ICON_BG = 'bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]';
const STAT_ICON_COLOR = '#024fa7';

interface EmployeeStatsProps {
  leavesTakenMonth: number;
  workingDaysWorked: number | string;
  lastPayslipNet: number;
  lastPayslipLabel: string;
  progressPosts: number;
  monthLabel: string;
}

export default function EmployeeStats({
  leavesTakenMonth,
  workingDaysWorked,
  lastPayslipNet,
  lastPayslipLabel,
  progressPosts,
  monthLabel,
}: EmployeeStatsProps) {
  const leavesLabel = `${leavesTakenMonth} ${leavesTakenMonth === 1 ? 'day' : 'days'}`;
  const postsLabel = `${progressPosts} ${progressPosts === 1 ? 'post' : 'posts'}`;
  const items: StatGridItem[] = [
    { title: 'Working Days', value: `${workingDaysWorked}`, change: monthLabel, iconName: 'time', iconColor: STAT_ICON_COLOR, iconBg: STAT_ICON_BG },
    { title: 'Leaves', value: leavesLabel, change: monthLabel, iconName: 'onLeaveToday', iconColor: STAT_ICON_COLOR, iconBg: STAT_ICON_BG },
    { title: 'Last Payslip', value: `PKR ${lastPayslipNet.toLocaleString()}`, change: lastPayslipLabel, iconName: 'payroll', iconColor: STAT_ICON_COLOR, iconBg: STAT_ICON_BG },
    { title: 'Progress Updates', value: postsLabel, change: monthLabel, iconName: 'goals', iconColor: STAT_ICON_COLOR, iconBg: STAT_ICON_BG },
  ];

  return (
    <DashboardStatsGrid
      items={items}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    />
  );
}
