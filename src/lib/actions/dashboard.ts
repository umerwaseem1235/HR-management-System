'use server';

import { createClient } from '@/lib/server';
import type { DashboardStats } from '@/lib/types';

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();

  const [{ count: totalEmployees }, { count: activeEmployees }] = await Promise.all([
    supabase.from('employees').select('*', { count: 'exact', head: true }),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
  ]);

  const today = new Date().toISOString().split('T')[0];
  const [{ count: presentToday }, { count: absentToday }, { count: onLeaveToday }, { count: lateToday }] = await Promise.all([
    supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'Present'),
    supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'Absent'),
    supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'Leave'),
    supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'Late'),
  ]);

  const [{ count: pendingLeaveApprovals }] = await Promise.all([
    supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
  ]);

  // If you don't have expense claims yet, just mock it
  let pendingExpenseApprovals = 0;
  try {
    const { count } = await supabase.from('expense_claims').select('*', { count: 'exact', head: true }).eq('status', 'Pending');
    pendingExpenseApprovals = count || 0;
  } catch (e) {
    // Ignore if table doesn't exist yet
  }

  const { data: openJobs } = await supabase.from('jobs').select('vacancies').eq('status', 'Open');
  const openVacancies = (openJobs || []).reduce((sum, job) => sum + (job.vacancies || 0), 0);

  // New joiners this month
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  const { count: newJoinersThisMonth } = await supabase.from('employees').select('*', { count: 'exact', head: true })
    .gte('joining_date', firstDayOfMonth);

  const { count: upcomingExits } = await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'On Notice');

  const { data: latestPayroll } = await supabase.from('payroll_runs').select('status').order('year', { ascending: false }).order('month_index', { ascending: false }).limit(1).maybeSingle();
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
