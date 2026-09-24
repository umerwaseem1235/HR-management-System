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

export interface DashboardEmployee {
  id: string;
  firstName: string;
  lastName: string;
  department: string;
  dateOfBirth: string | null;
  probationEndDate: string | null;
}

export interface DashboardData {
  stats: DashboardStats;
  employees: DashboardEmployee[];
  attendanceTrend: AttendanceTrendDay[];
}

function toDateString(date: Date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Optimized single-call dashboard loader.
 *
 * Why this exists (vs. 4 separate calls):
 * - AdminDashboard previously fired getDashboardStats() + getEmployees()
 *   + getPayrollRuns() + getAttendanceTrend(31) = 4 client->server round trips.
 * - getEmployees() selected ~30 columns + 5 joins, but the dashboard only
 *   needs 6 fields (dept chart + birthdays + probation).
 * - getPayrollRuns() fetched ALL runs just to derive the latest status label.
 * - getAttendanceTrend() had no upper bound / status filter (fetched all
 *   statuses, filtered in JS).
 *
 * This runs everything concurrently in ONE server action with lean selects.
 * Existing getDashboardStats()/getAttendanceTrend() are kept for compatibility.
 */
export async function getDashboardData(): Promise<DashboardData> {
  const supabase = await createClient();
  const now = new Date();
  const today = toDateString(now);
  const firstDayOfMonth = toDateString(new Date(now.getFullYear(), now.getMonth(), 1));
  const start = new Date(now);
  start.setDate(start.getDate() - 30);
  const startStr = toDateString(start);

  const [
    totalEmployeesRes,
    activeEmployeesRes,
    presentTodayRes,
    absentTodayRes,
    onLeaveTodayRes,
    lateTodayRes,
    pendingLeaveRes,
    pendingExpenseRes,
    openJobsRes,
    newJoinersRes,
    upcomingExitsRes,
    latestPayrollRes,
    employeesRes,
    attendanceRes,
  ] = await Promise.all([
    supabase.from('employees').select('id', { count: 'exact', head: true }),
    supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'Active'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'Present'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'Absent'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'Leave'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'Late'),
    supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('expense_claims').select('id', { count: 'exact', head: true }).eq('status', 'Pending').then(
      (res) => res,
      () => ({ count: 0 }) as any
    ),
    supabase.from('jobs').select('vacancies').eq('status', 'Open'),
    supabase.from('employees').select('id', { count: 'exact', head: true }).gte('joining_date', firstDayOfMonth),
    supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'On Notice'),
    supabase.from('payroll_runs').select('status').order('year', { ascending: false }).order('month_index', { ascending: false }).limit(1).maybeSingle(),
    // Lean employee payload: only what dept chart + upcoming events need.
    // NOTE: employees has NO `department` text column — it is department_id FK.
    supabase
      .from('employees')
      .select('id, first_name, last_name, date_of_birth, probation_end_date, departments(name)')
      .order('first_name', { ascending: true }),
    // Bounded + pre-filtered trend window (Present/Late only, last 31 days).
    supabase
      .from('attendance')
      .select('date, status')
      .gte('date', startStr)
      .lte('date', today)
      .in('status', ['Present', 'Late']),
  ]);

  const employees: DashboardEmployee[] = (employeesRes.data ?? []).map((e: any) => ({
    id: e.id,
    firstName: e.first_name ?? '',
    lastName: e.last_name ?? '',
    department: e.departments?.name ?? 'Unassigned',
    dateOfBirth: e.date_of_birth ?? null,
    probationEndDate: e.probation_end_date ?? null,
  }));

  const openVacancies = (openJobsRes.data ?? []).reduce((sum: number, j: any) => sum + (Number(j.vacancies) || 0), 0);

  const activeEmployees = activeEmployeesRes.count ?? 0;
  const byDate = new Map<string, number>();
  for (const r of (attendanceRes.data ?? []) as Array<{ date: string }>) {
    byDate.set(r.date, (byDate.get(r.date) ?? 0) + 1);
  }
  const attendanceTrend: AttendanceTrendDay[] = [];
  for (let d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    const iso = toDateString(new Date(d));
    const dt = new Date(d);
    attendanceTrend.push({
      date: iso,
      label: dt.toLocaleDateString('en-US', { weekday: 'short' }),
      fullLabel: dt.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      present: byDate.get(iso) ?? 0,
      total: activeEmployees,
    });
  }

  const presentToday = presentTodayRes.count ?? 0;
  const lateToday = lateTodayRes.count ?? 0;
  const presentCount = presentToday + lateToday;

  // Same label semantics as getPayrollStatus(): Pending | In Process | Finalized
  const latestStatus: string | null = (latestPayrollRes.data as any)?.status ?? null;
  const payrollStatus = !latestStatus ? 'Pending' : latestStatus === 'Finalized' ? 'Finalized' : 'In Process';

  const stats: DashboardStats = {
    totalEmployees: totalEmployeesRes.count ?? 0,
    activeEmployees,
    presentToday,
    absentToday: absentTodayRes.count ?? 0,
    onLeaveToday: onLeaveTodayRes.count ?? 0,
    lateToday,
    pendingLeaveApprovals: pendingLeaveRes.count ?? 0,
    pendingExpenseApprovals: (pendingExpenseRes as any)?.count ?? 0,
    openVacancies,
    newJoinersThisMonth: newJoinersRes.count ?? 0,
    upcomingExits: upcomingExitsRes.count ?? 0,
    payrollStatus,
    attendanceRate: activeEmployees > 0 ? Math.round((presentCount / activeEmployees) * 100) : 0,
  };

  return { stats, employees, attendanceTrend };
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
