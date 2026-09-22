'use server';

import { createClient } from '@/lib/server';
import type { DashboardStats } from '@/lib/types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  // Execute ALL count queries in a single Promise.all — eliminates sequential waterfalls
  const [
    { count: totalEmployees },
    { count: activeEmployees },
    { count: presentToday },
    { count: absentToday },
    { count: onLeaveToday },
    { count: lateToday },
    { count: pendingLeaveApprovals },
    expenseResult,
    { data: openJobs },
    { count: newJoinersThisMonth },
    { count: upcomingExits },
    { data: latestPayroll },
  ] = await Promise.all([
    supabase.from('employees').select('*', { count: 'exact', head: true }),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
    supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'Present'),
    supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'Absent'),
    supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'Leave'),
    supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'Late'),
    supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('expense_claims').select('*', { count: 'exact', head: true }).eq('status', 'Pending').then(
      (res) => res,
      () => ({ count: 0 }) // Graceful fallback if table doesn't exist
    ),
    supabase.from('jobs').select('vacancies').eq('status', 'Open'),
    supabase.from('employees').select('*', { count: 'exact', head: true }).gte('joining_date', firstDayOfMonth),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'On Notice'),
    supabase.from('payroll_runs').select('status').order('year', { ascending: false }).order('month_index', { ascending: false }).limit(1).maybeSingle(),
  ]);

  const pendingExpenseApprovals = expenseResult?.count || 0;
  const openVacancies = (openJobs || []).reduce((sum, job) => sum + (job.vacancies || 0), 0);
  const payrollStatus = latestPayroll?.status || 'Pending';

  const presentCount = (presentToday || 0) + (lateToday || 0);
  const totalCount = activeEmployees || 1;
  const attendanceRate = Math.round((presentCount / totalCount) * 100);

  return {
    totalEmployees: totalEmployees || 0,
    activeEmployees: activeEmployees || 0,
    presentToday: presentToday || 0,
    absentToday: absentToday || 0,
    onLeaveToday: onLeaveToday || 0,
    lateToday: lateToday || 0,
    pendingLeaveApprovals: pendingLeaveApprovals || 0,
    pendingExpenseApprovals,
    openVacancies,
    newJoinersThisMonth: newJoinersThisMonth || 0,
    upcomingExits: upcomingExits || 0,
    payrollStatus,
    attendanceRate,
  };
}

export interface AttendanceTrendDay {
  date: string;
  label: string;
  fullLabel: string;
  present: number;
  total: number;
}

/** Real per-day present counts for the last `days` days (for the trend chart). */
export async function getAttendanceTrend(days: number = 7): Promise<AttendanceTrendDay[]> {
  const supabase = await createClient();

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const startStr = start.toISOString().slice(0, 10);

  const [{ count: totalActive }, { data: records }] = await Promise.all([
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
    supabase.from('attendance').select('date, status').gte('date', startStr),
  ]);

  const byDate = new Map<string, number>();
  (records || []).forEach((r: any) => {
    if (r.status === 'Present' || r.status === 'Late') {
      byDate.set(r.date, (byDate.get(r.date) || 0) + 1);
    }
  });

  const out: AttendanceTrendDay[] = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const iso = d.toISOString().slice(0, 10);
    out.push({
      date: iso,
      label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      fullLabel: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      present: byDate.get(iso) || 0,
      total: totalActive || 0,
    });
  }
  return out;
}
