'use server';

import { createClient } from '@/lib/server';
import type { DashboardStats } from '@/lib/types';
import type { Database } from '@/lib/supabase/database.types';
import type { SupabaseClient } from '@supabase/supabase-js';

type JobRow = Pick<Database['public']['Tables']['jobs']['Row'], 'vacancies'>;
type PayrollRunRow = Database['public']['Tables']['payroll_runs']['Row'];

type DashboardEmployeeSource = Pick<
  Database['public']['Tables']['employees']['Row'],
  'id' | 'first_name' | 'last_name' | 'date_of_birth' | 'probation_end_date' | 'user_id'
> & { departments?: { name: string | null } | null };

type AttendanceTrendSource = Pick<Database['public']['Tables']['attendance']['Row'], 'date' | 'status'>;

type EmployeeLean = Pick<Database['public']['Tables']['employees']['Row'], 'id' | 'status' | 'joining_date' | 'user_id'>;

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
 * Super-admin logins get an auto-linked employee row on first use, but those
 * rows must never appear in the employee module (see getEmployees()) — so the
 * dashboard excludes them too, otherwise its counts disagree with the
 * directory. Returns the user ids; empty when none exist.
 */
async function getSuperAdminUserIds(supabase: SupabaseClient<Database>): Promise<string[]> {
  const { data } = await supabase.from('users').select('id').eq('role', 'super_admin');
  return (data ?? []).map((u) => u.id);
}

/**
 * Drops employee rows linked to super-admin logins from a count/list query
 * while keeping unlinked rows (user_id IS NULL). A plain
 * `.not('user_id', 'in', …)` would also drop NULL rows, so the NULL check is
 * explicit. Empty id list → the query is returned untouched.
 */
function withoutSuperAdminLinkedRows<T extends { or: (filters: string) => T }>(
  query: T,
  superAdminIds: string[],
): T {
  if (superAdminIds.length === 0) return query;
  return query.or(`user_id.is.null,user_id.not.in.(${superAdminIds.join(',')})`);
}

/**
 * Computes today's absent and on-leave counts from expected employees minus those accounted for.
 * Absent = expected employees (joined, not inactive, not super-admin-linked) who have no attendance row today with a non-Absent status,
 *          and are not on approved leave/remote covering today, minus weekends/holidays (no-shows not counted on non-working days).
 * Explicit 'Absent' rows are always counted.
 */
async function computeAbsentAndLeaveStats(
  supabase: SupabaseClient<Database>,
  today: string,
): Promise<{ absentToday: number; onLeaveToday: number; superAdminIds: string[] }> {
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
  const [expectedRes, rowsRes, approvedLeavesRes, approvedRemotesRes, superAdminIds] = await Promise.all([
    // Expected employees: not Inactive, joined on or before today
    supabase
      .from('employees')
      .select('id, status, joining_date, user_id')
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
    // Super-admin-linked rows are hidden from the employee module — hide here too
    getSuperAdminUserIds(supabase),
  ]);

  const superAdminIdSet = new Set(superAdminIds);
  const expected = ((expectedRes.data ?? []) as EmployeeLean[])
    .filter((e) => e.status !== 'Inactive' && !(e.user_id && superAdminIdSet.has(e.user_id)))
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
    return { absentToday, onLeaveToday, superAdminIds };
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

  return { absentToday, onLeaveToday, superAdminIds };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  // Compute derived absent/leave stats first (needs attendance/leave/remote rows).
  // Reuses its super-admin id list so the counts below match the employee module.
  const { absentToday, onLeaveToday, superAdminIds } = await computeAbsentAndLeaveStats(supabase, today);

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
    withoutSuperAdminLinkedRows(supabase.from('employees').select('*', { count: 'exact', head: true }).neq('status', 'Inactive'), superAdminIds),
    withoutSuperAdminLinkedRows(supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Active'), superAdminIds),
    supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'Present'),
    supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('date', today).eq('status', 'Late'),
    supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('expense_claims').select('*', { count: 'exact', head: true }).eq('status', 'Pending').then(
      (res) => res,
      () => ({ count: 0 }) as { count: number | null } // Graceful fallback if table doesn't exist
    ),
    supabase.from('jobs').select('vacancies').eq('status', 'Open'),
    withoutSuperAdminLinkedRows(supabase.from('employees').select('*', { count: 'exact', head: true }).gte('joining_date', firstDayOfMonth), superAdminIds),
    withoutSuperAdminLinkedRows(supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'On Notice'), superAdminIds),
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

  // Compute derived absent/leave stats first. Reuses its super-admin id
  // list so every employee count below matches the employee module.
  const { absentToday, onLeaveToday, superAdminIds } = await computeAbsentAndLeaveStats(supabase, today);

  // Resolve current user's linked employee id for their own check-in status
  const { data: authData } = await supabase.auth.getUser();
  const authUid = authData.user?.id ?? '';
  const { data: linked } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', authUid)
    .maybeSingle();
  const myEmployeeId = linked?.id ?? null;

  // Fetch current user's today attendance row if linked
  const myAttendancePromise = myEmployeeId
    ? supabase
        .from('attendance')
        .select('check_in, check_out')
        .eq('employee_id', myEmployeeId as string)
        .eq('date', today)
        .maybeSingle()
    : Promise.resolve({ data: null });

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
    myAttendanceRes,
  ] = await Promise.all([
    withoutSuperAdminLinkedRows(supabase.from('employees').select('id', { count: 'exact', head: true }).neq('status', 'Inactive'), superAdminIds),
    withoutSuperAdminLinkedRows(supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'Active'), superAdminIds),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'Present'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'Late'),
    supabase.from('leave_requests').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
    supabase.from('expense_claims').select('id', { count: 'exact', head: true }).eq('status', 'Pending').then(
      (res) => res,
      () => ({ count: 0 }) as { count: number | null }
    ),
    supabase.from('jobs').select('vacancies').eq('status', 'Open'),
    withoutSuperAdminLinkedRows(supabase.from('employees').select('id', { count: 'exact', head: true }).gte('joining_date', firstDayOfMonth), superAdminIds),
    withoutSuperAdminLinkedRows(supabase.from('employees').select('id', { count: 'exact', head: true }).eq('status', 'On Notice'), superAdminIds),
    supabase.from('payroll_runs').select('status').order('year', { ascending: false }).order('month_index', { ascending: false }).limit(1).maybeSingle(),
    // Lean employee payload: only what dept chart + upcoming events need.
    // NOTE: employees has NO `department` text column — it is department_id FK.
    // user_id is selected only to drop super-admin-linked rows (same rule as
    // the employee module) — it is not exposed to the client type.
    supabase
      .from('employees')
      .select('id, first_name, last_name, date_of_birth, probation_end_date, user_id, departments(name)')
      .order('first_name', { ascending: true }),
    // Bounded + pre-filtered trend window (Present/Late only, last 31 days).
    supabase
      .from('attendance')
      .select('date, status')
      .gte('date', startStr)
      .lte('date', today)
      .in('status', ['Present', 'Late']),
    myAttendancePromise,
  ]);

  const superAdminIdSet = new Set(superAdminIds);
  const employees: DashboardEmployee[] = ((employeesRes.data ?? []) as unknown as DashboardEmployeeSource[])
    .filter((e) => !e.user_id || !superAdminIdSet.has(e.user_id))
    .map((e) => ({
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

  // Current user's check-in state for today
  const myAttendance = myAttendanceRes.data as { check_in: string | null; check_out: string | null } | null;
  const myCheckedIn = !!myAttendance?.check_in && !myAttendance?.check_out;
  const myCheckInTime = myAttendance?.check_in ? myAttendance.check_in.slice(0, 5) : null;

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
    myCheckedIn,
    myCheckInTime,
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
    withoutSuperAdminLinkedRows(
      supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'Active'),
      await getSuperAdminUserIds(supabase),
    ),
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
