'use client';

import DashboardStatsGrid from '../widgets/DashboardStatsGrid';
import type { StatGridItem } from '../dashboard-types';

const STAT_ICON_BG = 'bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]';
const STAT_ICON_COLOR = '#024fa7';

interface EmployeeStatsProps {
  leaveRemainingTotal: number;
  lastPayslipNet: number;
  goalsCompleted: number;
  goalsTotal: number;
}

export default function EmployeeStats({
  leaveRemainingTotal,
  lastPayslipNet,
  goalsCompleted,
  goalsTotal,
}: EmployeeStatsProps) {
  const items: StatGridItem[] = [
    { title: 'Working Days', value: '22/23', iconName: 'time', iconColor: STAT_ICON_COLOR, iconBg: STAT_ICON_BG },
    { title: 'Leave Balance', value: `${leaveRemainingTotal} days`, iconName: 'onLeaveToday', iconColor: STAT_ICON_COLOR, iconBg: STAT_ICON_BG },
    { title: 'Last Payslip', value: `PKR ${lastPayslipNet.toLocaleString()}`, iconName: 'payroll', iconColor: STAT_ICON_COLOR, iconBg: STAT_ICON_BG },
    { title: 'Goals Progress', value: `${goalsCompleted}/${goalsTotal}`, iconName: 'goals', iconColor: STAT_ICON_COLOR, iconBg: STAT_ICON_BG },
  ];

  return (
    <DashboardStatsGrid
      items={items}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    />
  );
}
