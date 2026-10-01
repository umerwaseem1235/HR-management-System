'use server';

import { createClient } from '@/lib/server';
import { getLeaveBalances, getLeaveRequests } from './leave';
import { getPayslips } from './payroll';
import { getAttendanceByEmployee, getHolidays } from './attendance';
import { getProgressEntries } from './progress';
import { toDateStr } from '@/utils/date';
import type { LeaveBalance, Payslip, ProgressEntry } from '@/lib/types';

export interface EmployeeDashboardBundle {
  balances: LeaveBalance[];
  slips: Payslip[];
  progressEntries: ProgressEntry[];
  monthSummary: { worked: number; total: number; leavesTaken: number; monthLabel: string };
  checkedIn: boolean;
  checkInTime: string | null;
}

/**
 * Single-round-trip loader for the employee dashboard.
 *
 * Previously the client fired 7 separate server actions (leave balances,
 * payslips, month attendance, holidays, leave requests, progress entries,
 * plus a full-day attendance scan for today's check-in state) — 7 HTTP round
 * trips after already waiting on auth + the employee directory. On first
 * load that stacked ~9 sequential trips before anything painted.
 *
 * This runs all reads concurrently server-side and returns one payload.
 * Today's check-in state uses a lean direct query instead of scanning the
 * whole day's rows (which also dragged per-employee avatar blobs).
 */
export async function getEmployeeDashboardBundle(employeeId: string): Promise<EmployeeDashboardBundle> {
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const year = now.getFullYear();
  const monthIdx = now.getMonth();
  const monthNum = monthIdx + 1;
  const prefix = `${year}-${String(monthNum).padStart(2, '0')}`;
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const supabase = await createClient();
  const [b, s, att, hols, leaveReqs, prog, todayRow] = await Promise.all([
    getLeaveBalances(employeeId),
    getPayslips(employeeId),
    getAttendanceByEmployee(employeeId, year, monthNum),
    getHolidays(),
    getLeaveRequests(employeeId),
    getProgressEntries(employeeId),
    supabase
      .from('attendance')
      .select('check_in, check_out')
      .eq('employee_id', employeeId)
      .eq('date', today)
      .maybeSingle(),
  ]);

  // ── Real monthly summary (current month, up to today) ──
  const mine = att.filter((r) => r.date.startsWith(prefix) && r.date <= today);
  const presentLike = mine.filter((r) => r.status === 'Present' || r.status === 'Late').length;
  const halfLike = mine.filter((r) => r.status === 'Half Day').length;
  const worked = Math.round((presentLike + halfLike * 0.5) * 10) / 10;

  // Working-day denominator: weekdays elapsed this month minus holidays.
  const monthStart = new Date(year, monthIdx, 1);
  const todayDate = new Date(today + 'T00:00:00');
  let total = 0;
  for (let d = new Date(monthStart); d <= todayDate; d.setDate(d.getDate() + 1)) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) total++;
  }
  const holidayDates = new Set(
    hols
      .filter((h) => h.date >= toDateStr(monthStart) && h.date <= today)
      .filter((h) => {
        const hd = new Date(h.date + 'T00:00:00');
        const w = hd.getDay();
        return w !== 0 && w !== 6;
      })
      .map((h) => h.date),
  );
  total = Math.max(0, total - holidayDates.size);

  // Leaves taken: 'Leave' attendance days + approved request days in month.
  const leaveDates = new Set(mine.filter((r) => r.status === 'Leave').map((r) => r.date));
  let approvedExtra = 0;
  const monthEnd = new Date(year, monthIdx + 1, 0);
  leaveReqs
    .filter((l) => l.status === 'Approved')
    .forEach((l) => {
      const start = new Date(l.startDate);
      const end = new Date(l.endDate);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return;
      const overlapStart = start > monthStart ? start : monthStart;
      const overlapEnd = end < monthEnd ? end : monthEnd;
      for (let d = new Date(overlapStart); d <= overlapEnd; d.setDate(d.getDate() + 1)) {
        const ds = toDateStr(d);
        if (ds > today) continue;
        if (!leaveDates.has(ds)) approvedExtra++;
      }
    });

  const row = todayRow.data as { check_in: string | null; check_out: string | null } | null;
  return {
    balances: b,
    slips: s,
    progressEntries: prog.filter((p) => p.submissionDate.startsWith(prefix)),
    monthSummary: {
      worked,
      total,
      leavesTaken: leaveDates.size + approvedExtra,
      monthLabel,
    },
    checkedIn: !!row?.check_in && !row?.check_out,
    checkInTime: row?.check_in || null,
  };
}
