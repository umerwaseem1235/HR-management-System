'use client';

import { CalendarDays, Clock, Sun, UserCheck, UserX } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
export interface TodayAttendanceStats {
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
}

const ICON_CLASS = 'text-[#024fa7]';
const ICON_BG = 'bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]';

export function TodaySnapshot({ stats, halfDayToday = 0 }: { stats: TodayAttendanceStats; halfDayToday?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard title="Present" value={stats.presentToday} icon={<UserCheck size={18} strokeWidth={1.6} className={ICON_CLASS} />} iconBg={ICON_BG} change="Today" />
      <StatCard title="Absent" value={stats.absentToday} icon={<UserX size={18} strokeWidth={1.6} className={ICON_CLASS} />} iconBg={ICON_BG} change="Today" />
      <StatCard title="Late" value={stats.lateToday} icon={<Clock size={18} strokeWidth={1.6} className={ICON_CLASS} />} iconBg={ICON_BG} change="Today" />
      <StatCard title="Half Day" value={halfDayToday} icon={<Sun size={18} strokeWidth={1.6} className={ICON_CLASS} />} iconBg={ICON_BG} change="Today" />
      <StatCard title="On Leave" value={stats.onLeaveToday} icon={<CalendarDays size={18} strokeWidth={1.6} className={ICON_CLASS} />} iconBg={ICON_BG} change="Today" />
    </div>
  );
}

export function MyAttendanceStats({
  presentDays,
  absentDays,
  lateDays,
  halfDayDays,
  leavesTaken,
  monthLabel,
}: {
  presentDays: number;
  absentDays: number;
  lateDays: number;
  halfDayDays: number;
  leavesTaken: number;
  monthLabel: string;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard title="Present Days" value={presentDays} change={monthLabel} icon={<UserCheck size={18} strokeWidth={1.6} className={ICON_CLASS} />} iconBg={ICON_BG} />
      <StatCard title="Absent Days" value={absentDays} change={monthLabel} icon={<UserX size={18} strokeWidth={1.6} className={ICON_CLASS} />} iconBg={ICON_BG} />
      <StatCard title="Late Days" value={lateDays} change={monthLabel} icon={<Clock size={18} strokeWidth={1.6} className={ICON_CLASS} />} iconBg={ICON_BG} />
      <StatCard title="Half Days" value={halfDayDays} change={monthLabel} icon={<Sun size={18} strokeWidth={1.6} className={ICON_CLASS} />} iconBg={ICON_BG} />
      <StatCard title="Leaves Taken" value={leavesTaken} change={monthLabel} icon={<CalendarDays size={18} strokeWidth={1.6} className={ICON_CLASS} />} iconBg={ICON_BG} />
    </div>
  );
}
