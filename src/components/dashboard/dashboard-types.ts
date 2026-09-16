import type { ComponentProps } from 'react';
import type { LucideIcon } from 'lucide-react';
import type StatCard from '../ui/StatCard';
import type {
  DashboardStats,
  Goal,
  LeaveBalance,
  LeaveRequest,
  Notification,
  Payslip,
} from '../../lib/types';

export type { DashboardStats, Goal, LeaveBalance, LeaveRequest, Notification, Payslip };

/** Single point of the attendance trend series (moved here from AttendanceChart). */
export interface TrendPoint {
  label: string;
  fullLabel: string;
  value: number;
}

/** Item rendered by the shared stats-cards grid. */
export interface StatGridItem {
  title: string;
  value: string | number;
  iconName?: ComponentProps<typeof StatCard>['iconName'];
  iconColor?: string;
  iconBg?: string;
}

/** Item rendered by the admin quick-stats (mini card) row. */
export interface QuickStatItem {
  icon: LucideIcon;
  value: string | number;
  label: string;
}

export interface DepartmentCount {
  name: string;
  count: number;
  color: string;
}

export interface UpcomingEvent {
  type: 'birthday' | 'anniversary' | 'probation';
  name: string;
  date: string;
  icon: LucideIcon;
}
