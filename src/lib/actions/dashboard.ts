'use server';

import { createClient } from '@/lib/server';
import type { DashboardStats } from '@/lib/types';
import type { Database } from '@/lib/supabase/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

type JobRow = Pick<Database['public']['Tables']['jobs']['Row'], 'vacancies'>;
type PayrollRunRow = Database['public']['Tables']['payroll_runs']['Row'];

type DashboardEmployeeSource = Pick<
  Database['public']['Tables']['employees']['Row'],
  'id' | 'first_name' | 'last_name' | 'date_of_birth' | 'probation_end_date'
> & { departments?: { name: string | null } | null };

type AttendanceTrendSource = Pick<Database['public']['Tables']['attendance']['Row'], 'date' | 'status'>;

type EmployeeLean = Pick<Database['public']['Tables']['employees']['Row'], 'id' | 'status' | 'joining_date'>;

interface AttendanceRowLean {
  employee_id: string;
  status: string;
}

interface LeaveRequestLean {
  employee_id: string;
  start_date: string;
  end_date: string;
}

interface RemoteRequestLean {
  employee_id: string;
  from_date: string;
  to_date: string;
}

/**
 * Computes today's absent and on-leave counts from expected employees minus those accounted for.
 * Absent = expected employees (joined, not inactive) who have no attendance row today with a non-Absent status,
 *          and are not on approved leave/remote covering today, minus weekends/holidays (no-shows not counted on non-working days).
 * Explicit 'Absent' rows are always counted.
 */
async function computeAbsentAndLeaveStats(
  supabase: SupabaseClient<Database>,
  today: string,
): Promise<{ absentToday: number; onLeaveToday: number }> {
  // Weekend check: day 0 = Sunday, day 6 = Saturday (per existing codebase convention)
  const dayOfWeek = new Date(today + 'T00:00:00').getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Holiday check
  const { data: holidays } = await supabase
    .from('holidays')
    .select('date, is_recurring');
  const isHoliday = (holidays ?? []).some(
    (h) => h.date === today || (h.is_recurring && h.date.slice(5) === today.slice(5)),
  );

  const isNonWorkingDay = isWeekend || isHoliday;

  // Fetch data in parallel
  const [expectedRes, rowsRes, approvedLeavesRes, approvedRemotesRes] = await Promise.all([
    // Expected employees: not Inactive, joined on or before today
    supabase
      .from('employees')
      .select('id, status, joining_date')
      .neq('status', 'Inactive')
      .lte('joining_date', today),
    // Today's attendance rows
    supabase.from('attendance').select('employee_id, status').eq('date', today),
    // Approved leave requests covering today
    supabase
      .from('leave_requests')
      .select('employee_id')
      .eq('status', 'Approved')
      .lte('start_date', today)
      .gte('end_date', today),
    // Approved remote work requests covering today
    supabase
      .from('remote_requests')
      .select('employee_id')
      .eq('status', 'Approved')
      .lte('from_date', today)
      .gte('to_date', today),
  ]);

  const expected = ((expectedRes.data ?? []) as EmployeeLean[])
    .filter((e) => e.status !== 'Inactive')
    .map((e) => e.id);
  const expectedSet = new Set(expected);

  const rows = (rowsRes.data ?? []) as AttendanceRowLean[];
  const explicitAbsent = new Set(rows.filter((r) => r.status === 'Absent').map((r) => r.employee_id));
  // Accounted: any row today whose status is NOT 'Absent' (Present, Late, Half Day, Leave, Holiday, Weekend)
  const accounted = new Set(rows.filter((r) => r.status !== 'Absent').map((r) => r.employee_id));

  const approvedLeaveIds = new Set(
    ((approvedLeavesRes.data ?? []) as LeaveRequestLean[]).map((l) => l.employee_id),
  );
  const approvedRemoteIds = new Set(
    ((approvedRemotesRes.data ?? []) as RemoteRequestLean[]).map((r) => r.employee_id),
  );

  // On leave today = attendance 'Leave' rows ∪ approved leave requests (distinct employees)
  const leaveRowIds = new Set(rows.filter((r) => r.status === 'Leave').map((r) => r.employee_id));
  const onLeaveSet = new Set([...leaveRowIds, ...approvedLeaveIds]);
  const onLeaveToday = [...onLeaveSet].filter((id) => expectedSet.has(id)).length;

  if (isNonWorkingDay) {
    // On non-working days, only explicit 'Absent' rows count (HR manually marked)
    const absentToday = [...explicitAbsent].filter((id) => expectedSet.has(id)).length;
    return { absentToday, onLeaveToday };
  }

  // Working day: absent = expected employees not in accounted, not on approved leave/remote, but explicit Absent always counts
  let absentToday = 0;
  for (const id of expected) {
    const isExplicitAbsent = explicitAbsent.has(id);
    const isAccounted = accounted.has(id);
    const isOnLeave = approvedLeaveIds.has(id);
    const isRemote = approvedRemoteIds.has(id);
    if (isExplicitAbsent) {
      absentToday++;
    } else if (!isAccounted && !isOnLeave && !isRemote) {
      absentToday++;
    }
  }

  return { absentToday, onLeaveToday };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  // Compute derived absent/leave stats first (needs attendance/leave/remote rows)
  const { absentToday, onLeaveToday } = await computeAbsentAndLeaveStats(supabase, today);

  // Execute remaining count queries in parallel
  const [
    { count: totalEmployees },
    { count: activeEmployees },
    { count: presentToday },
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
    supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'Late'),
    supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('expense_claims').select('*', { count: 'exact', head: true }).eq('status', 'Pending').then(
      (res) => res,
      () => ({ count: 0 }) as { count: number | null } // Graceful fallback if table doesn't exist
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
    absentToday,
    onLeaveToday,
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

  // Compute derived absent/leave stats first
  const { absentToday, onLeaveToday } = await computeAbsentAndLeaveStats(supabase, today);

  const [
    totalEmployeesRes,
    activeEmployeesRes,
    presentTodayRes,
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
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'Late'),
    supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('expense_claims').select('id', { count: 'exact', head: true }).eq('status', 'Pending').then(
      (res) => res,
      () => ({ count: 0 }) as { count: number | null }
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

  const employees: DashboardEmployee[] = ((employeesRes.data ?? []) as unknown as DashboardEmployeeSource[]).map((e) => ({
    id: e.id,
    firstName: e.first_name ?? '',
    lastName: e.last_name ?? '',
    department: e.departments?.name ?? 'Unassigned',
    dateOfBirth: e.date_of_birth ?? null,
    probationEndDate: e.probation_end_date ?? null,
  }));

  const openVacancies = (openJobsRes.data ?? []).reduce((sum: number, j: JobRow) => sum + (Number(j.vacancies) || 0), 0);

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
  const latestStatus: string | null = (latestPayrollRes.data as PayrollRunRow | null)?.status ?? null;
  const payrollStatus = !latestStatus ? 'Pending' : latestStatus === 'Finalized' ? 'Finalized' : 'In Process';

  const stats: DashboardStats = {
    totalEmployees: totalEmployeesRes.count ?? 0,
    activeEmployees,
    presentToday,
    absentToday,
    onLeaveToday,
    lateToday,
    pendingLeaveApprovals: pendingLeaveRes.count ?? 0,
    pendingExpenseApprovals: (pendingExpenseRes as { count: number | null }).count ?? 0,
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
  (records || []).forEach((r: AttendanceTrendSource) => {
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
