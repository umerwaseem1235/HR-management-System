'use server';

import { createClient } from '@/lib/server';
import { createClient as createServiceClient, type PostgrestError } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { AttendanceRecord } from '@/lib/types';
import type { Database } from '@/lib/supabase/database.types';
import { companyDateStr, companyTimeStr, isEarlyHalfDayCheckout, effectiveAttendanceStatus } from '@/utils/date';
import { calculateDistance, getOfficeLocationConfig } from '@/lib/location';

type AttendanceStatus = Database['public']['Tables']['attendance']['Row']['status'];

interface EmployeeNameJoin {
  first_name?: string | null;
  last_name?: string | null;
  avatar?: string | null;
}

interface AttendanceRowWithEmployee {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  work_hours: number | null;
  overtime: number | null;
  notes: string | null;
  check_in_lat?: number | null;
  check_in_lng?: number | null;
  check_out_lat?: number | null;
  check_out_lng?: number | null;
  distance_from_office?: number | null;
  employees?: EmployeeNameJoin | EmployeeNameJoin[] | null;
}

interface CorrectionRowWithEmployee {
  id: string;
  employee_id: string;
  date: string;
  requested_status: string | null;
  requested_check_in: string | null;
  requested_check_out: string | null;
  reason: string | null;
  status: string | null;
  employees?: EmployeeNameJoin | EmployeeNameJoin[] | null;
}

interface HolidayRowLike {
  id: string;
  name: string;
  date: string;
  type: string | null;
  is_recurring: boolean | null;
}

interface AuditRowLike {
  id: string;
  user_id: string | null;
  user_name: string | null;
  module: string;
  action: string;
  record: string | null;
  previous_value: string | null;
  new_value: string | null;
  created_at: string;
}

interface AttendanceFormInput {
  employeeId?: string;
  employee_id?: string;
  date: string;
  checkIn?: string | null;
  check_in?: string | null;
  checkOut?: string | null;
  check_out?: string | null;
  status: AttendanceStatus;
  workHours?: number | null;
  work_hours?: number | null;
  overtime?: number | null;
  notes?: string | null;
  checkInLat?: number | null;
  check_in_lat?: number | null;
  checkInLng?: number | null;
  check_in_lng?: number | null;
  checkOutLat?: number | null;
  check_out_lat?: number | null;
  checkOutLng?: number | null;
  check_out_lng?: number | null;
  distanceFromOffice?: number | null;
  distance_from_office?: number | null;
}

type CorrectionInsert = Database['public']['Tables']['attendance_corrections']['Insert'];

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getMonthDateRange(year: number, month: number): { start: string; end: string } {
  const lastDay = getLastDayOfMonth(year, month);
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function mapAttendance(db: AttendanceRowWithEmployee): AttendanceRecord {
  if (!db) {
    throw new Error('No attendance record returned from database.');
  }
  const emp = Array.isArray(db.employees) ? db.employees[0] : db.employees;
  const employeeName = emp
    ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
    : '';

  // Missing-checkout → Half Day rule: a past day with a check-in but no
  // check-out reads as 'Half Day' (half leave) even if the midnight
  // cron / lazy close hasn't rewritten the stored row yet. Today stays
  // 'Present'/'Late' while the employee may still be in the office.
  const effectiveStatus = effectiveAttendanceStatus(
    db.date,
    db.check_in,
    db.check_out,
    db.status,
  ) as AttendanceRecord['status'];
  const storedHours = db.work_hours != null ? Number(db.work_hours) || 0 : 0;

  return {
    id: db.id,
    employeeId: db.employee_id,
    employeeName,
    employeeAvatar: emp?.avatar ?? undefined,
    date: db.date,
    checkIn: db.check_in ? db.check_in.slice(0, 5) : '',
    checkOut: db.check_out ? db.check_out.slice(0, 5) : '',
    status: effectiveStatus,
    workHours: effectiveStatus === 'Half Day' && storedHours <= 0 ? 4 : storedHours,
    overtime: db.overtime != null ? Number(db.overtime) || 0 : 0,
    notes: db.notes ?? undefined,
    checkInLat: db.check_in_lat ?? undefined,
    checkInLng: db.check_in_lng ?? undefined,
    checkOutLat: db.check_out_lat ?? undefined,
    checkOutLng: db.check_out_lng ?? undefined,
    distanceFromOffice: db.distance_from_office ?? undefined,
  };
}

/**
 * Best-effort persistence for the missing-checkout rule.
 *
 * `mapAttendance` already corrects the display, but stats counts and
 * payroll read the stored `status` — so whenever a read batch contains
 * stale open rows (past date, check-in set, no check-out, still
 * Present/Late), flip them to 'Half Day' in the DB. Failures are
 * swallowed (e.g. RLS) because the display fallback already covers them.
 */
async function healStaleOpenRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Array<{ id: string; date: string; check_in: string | null; check_out: string | null; status: string }>,
  today: string,
): Promise<number> {
  const staleIds = rows
    .filter(
      (r) =>
        r.date < today &&
        r.check_in != null &&
        r.check_out == null &&
        (r.status === 'Present' || r.status === 'Late'),
    )
    .map((r) => r.id);
  if (!staleIds.length) return 0;
  try {
    const { error } = await supabase
      .from('attendance')
      .update({ status: 'Half Day', work_hours: 4 })
      .in('id', staleIds)
      .in('status', ['Present', 'Late']);
    return error ? 0 : staleIds.length;
  } catch {
    return 0;
  }
}

/* ------------------------------------------------------------------ */
/*  Queries                                                            */
/* ------------------------------------------------------------------ */

const ATTENDANCE_LIST_COLUMNS =
  'id, employee_id, date, check_in, check_out, status, work_hours, overtime, notes, check_in_lat, check_in_lng, check_out_lat, check_out_lng, distance_from_office, employees(first_name, last_name, avatar)';

export async function getAttendanceByDate(
  date: string,
): Promise<AttendanceRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select(ATTENDANCE_LIST_COLUMNS)
    .eq('date', date)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  const rows = (data || []) as unknown as AttendanceRowWithEmployee[];
  await healStaleOpenRows(
    supabase,
    rows as unknown as Array<{ id: string; date: string; check_in: string | null; check_out: string | null; status: string }>,
    companyDateStr(),
  );
  return rows.map((row) => mapAttendance(row));
}

export async function getAttendanceByEmployee(
  employeeId: string,
  year?: number,
  month?: number,
): Promise<AttendanceRecord[]> {
  const supabase = await createClient();
  let query = supabase
    .from('attendance')
    .select(ATTENDANCE_LIST_COLUMNS)
    .eq('employee_id', employeeId)
    .order('date', { ascending: true });

  if (year && month) {
    const { start, end } = getMonthDateRange(year, month);
    query = query.gte('date', start).lte('date', end);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data || []) as unknown as AttendanceRowWithEmployee[];
  await healStaleOpenRows(
    supabase,
    rows as unknown as Array<{ id: string; date: string; check_in: string | null; check_out: string | null; status: string }>,
    companyDateStr(),
  );
  return rows.map((row) => mapAttendance(row));
}

export async function getAllAttendance(
  year?: number,
  month?: number,
): Promise<AttendanceRecord[]> {
  const supabase = await createClient();
  let query = supabase
    .from('attendance')
    .select(ATTENDANCE_LIST_COLUMNS)
    .order('date', { ascending: true });

  if (year && month) {
    const { start, end } = getMonthDateRange(year, month);
    query = query.gte('date', start).lte('date', end);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data || []) as unknown as AttendanceRowWithEmployee[];
  await healStaleOpenRows(
    supabase,
    rows as unknown as Array<{ id: string; date: string; check_in: string | null; check_out: string | null; status: string }>,
    companyDateStr(),
  );
  return rows.map((row) => mapAttendance(row));
}

/** Compute live attendance stats for a given date (defaults to today). */
export async function getAttendanceStats(date?: string) {
  const supabase = await createClient();
  const targetDate = date ?? companyDateStr();
  const today = companyDateStr();

  // Missing-checkout → Half Day: a past date left open overnight must not
  // count as Present. Heal the stored rows first so counts are correct even
  // when the midnight cron never ran (local dev / missing CRON_SECRET).
  if (targetDate < today) {
    try {
      await supabase
        .from('attendance')
        .update({ status: 'Half Day', work_hours: 4 })
        .eq('date', targetDate)
        .not('check_in', 'is', null)
        .is('check_out', null)
        .in('status', ['Present', 'Late']);
    } catch {
      // RLS / offline — fall through to the JS adjustment below.
    }
  }

  // Count-only queries in parallel — the old version downloaded every row
  // for the date and counted in JS.
  const [
    { count: presentToday },
    { count: absentToday },
    { count: lateToday },
    { count: onLeaveToday },
    staleOpen,
  ] = await Promise.all([
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', targetDate).eq('status', 'Present'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', targetDate).eq('status', 'Absent'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', targetDate).eq('status', 'Late'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', targetDate).eq('status', 'Leave'),
    // Backstop when the heal update above was blocked (RLS): count rows the
    // display layer already treats as Half Day so Present isn't overstated.
    targetDate < today
      ? supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', targetDate).not('check_in', 'is', null).is('check_out', null).in('status', ['Present', 'Late'])
      : Promise.resolve({ count: 0 as number | null }),
  ]);

  const staleCount = staleOpen?.count ?? 0;
  // If the heal didn't persist (rows still Present/Late), shift them out of
  // Present/Late in the returned numbers to match the displayed Half Day.
  // When heal succeeded staleCount is already 0, so this is a no-op.
  let present = presentToday ?? 0;
  let late = lateToday ?? 0;
  if (staleCount > 0 && targetDate < today) {
    const shiftFromPresent = Math.min(present, staleCount);
    present -= shiftFromPresent;
    late = Math.max(0, late - (staleCount - shiftFromPresent));
  }

  return {
    presentToday: present,
    absentToday: absentToday ?? 0,
    lateToday: late,
    onLeaveToday: onLeaveToday ?? 0,
  };
}

/* ------------------------------------------------------------------ */
/*  Optimized single-call loader (dashboard-style)                     */
/* ------------------------------------------------------------------ */

/**
 * Single round trip for the attendance page.
 *
 * Before: useAttendance fired getEmployees (30 cols + 5 joins — only
 * id/email/name are used) + getAllAttendance + getCorrections +
 * getAuditLogsByModule (unbounded) + getHolidays + getAttendanceStats
 * = 6 client→server round trips. Now: one server action, Promise.all
 * with lean selects and a bounded audit trail.
 * Granular getters stay for day-switches and mutations.
 */
export async function getAttendanceData(year: number, month: number) {
  const supabase = await createClient();
  const lastDay = new Date(year, month, 0).getDate();
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  const today = companyDateStr();

  const [
    employeesRes,
    recordsRes,
    correctionsRes,
    holidaysRes,
    auditRes,
    presentRes,
    absentRes,
    lateRes,
    leaveRes,
  ] = await Promise.all([
    // Lean directory — attendance only matches on id/email/name.
    supabase
      .from('employees')
      .select('id, first_name, last_name, email')
      .order('first_name', { ascending: true }),
    supabase
      .from('attendance')
      .select(ATTENDANCE_LIST_COLUMNS)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true }),
    supabase
      .from('attendance_corrections')
      .select('id, employee_id, date, requested_status, requested_check_in, requested_check_out, reason, status, employees(first_name, last_name, avatar)')
      .order('created_at', { ascending: false }),
    supabase
      .from('holidays')
      .select('id, name, date, type, is_recurring')
      .order('date', { ascending: true }),
    // Bounded trail — the old call had no limit and grew forever.
    supabase
      .from('audit_logs')
      .select('*')
      .eq('module', 'Attendance')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'Present'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'Absent'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'Late'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today).eq('status', 'Leave'),
  ]);

  for (const [res, label] of [
    [employeesRes, 'employees'],
    [recordsRes, 'attendance'],
    [correctionsRes, 'corrections'],
    [holidaysRes, 'holidays'],
    [auditRes, 'audit logs'],
  ] as const) {
    if ((res as { error: unknown }).error) {
      throw new Error(`Failed to load ${label}: ${((res as { error: { message?: string } }).error as { message?: string })?.message ?? 'unknown error'}`);
    }
  }

  // Persist the missing-checkout → Half Day flip for any stale open rows in
  // this month so counts/payroll stay correct even if the cron never ran.
  // Display is already corrected by mapAttendance; this is best-effort.
  await healStaleOpenRows(
    supabase,
    ((recordsRes.data ?? []) as unknown as Array<{ id: string; date: string; check_in: string | null; check_out: string | null; status: string }>),
    today,
  );

  return {
    employees: ((employeesRes.data ?? []) as Array<{ id: string; first_name: string; last_name: string; email: string }>).map((e) => ({
      id: e.id,
      firstName: e.first_name ?? '',
      lastName: e.last_name ?? '',
      email: e.email ?? '',
    })),
    records: ((recordsRes.data ?? []) as unknown as AttendanceRowWithEmployee[]).map((row) => mapAttendance(row)),
    corrections: ((correctionsRes.data ?? []) as unknown as CorrectionRowWithEmployee[]).map((row) => {
      const emp = Array.isArray(row.employees) ? row.employees[0] : row.employees;
      return {
        id: row.id,
        employeeId: row.employee_id,
        employeeName: emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : 'Unknown',
        employeeAvatar: emp?.avatar ?? undefined,
        date: row.date,
        currentStatus: '',
        requestedStatus: row.requested_status || '',
        requestedCheckIn: row.requested_check_in || undefined,
        requestedCheckOut: row.requested_check_out || undefined,
        reason: row.reason || '',
        status: (row.status || 'Pending') as 'Pending' | 'Approved' | 'Rejected',
      };
    }),
    holidays: ((holidaysRes.data ?? []) as unknown as HolidayRowLike[]).map((row) => ({
      id: row.id,
      name: row.name,
      date: row.date,
      type: (row.type || 'Public') as 'Public' | 'Optional' | 'Company',
      isRecurring: row.is_recurring ?? false,
    })),
    auditLogs: ((auditRes.data ?? []) as unknown as AuditRowLike[]).map((row) => ({
      id: row.id,
      userId: row.user_id,
      userName: row.user_name,
      module: row.module,
      action: row.action,
      record: row.record,
      previousValue: row.previous_value,
      newValue: row.new_value,
      timestamp: row.created_at,
    })),
    stats: {
      presentToday: presentRes.count ?? 0,
      absentToday: absentRes.count ?? 0,
      lateToday: lateRes.count ?? 0,
      onLeaveToday: leaveRes.count ?? 0,
    },
  };
}

/* ------------------------------------------------------------------ */
/*  Mutations                                                          */
/* ------------------------------------------------------------------ */

export async function createAttendanceRecord(
  data: AttendanceFormInput,
): Promise<AttendanceRecord> {
  const supabase = await createClient();
  // Server-side enforcement of the missing-checkout rule so HR manual
  // entries for past dates can't stay 'Present' with no check-out.
  let status = data.status;
  const checkInVal = data.checkIn ?? data.check_in ?? null;
  const checkOutVal = data.checkOut ?? data.check_out ?? null;
  if (
    data.date < companyDateStr() &&
    checkInVal &&
    !checkOutVal &&
    (status === 'Present' || status === 'Late')
  ) {
    status = 'Half Day';
  }
  let workHoursVal = data.workHours ?? data.work_hours ?? 0;
  if (status === 'Half Day' && !(Number(workHoursVal) > 0)) {
    workHoursVal = 4;
  }
  const dbData: Database['public']['Tables']['attendance']['Insert'] = {
    employee_id: (data.employeeId || data.employee_id) as string,
    date: data.date,
    check_in: checkInVal,
    check_out: checkOutVal,
    status,
    work_hours: workHoursVal,
    overtime: data.overtime ?? 0,
    notes: data.notes ?? null,
    check_in_lat: data.checkInLat ?? data.check_in_lat ?? null,
    check_in_lng: data.checkInLng ?? data.check_in_lng ?? null,
    check_out_lat: data.checkOutLat ?? data.check_out_lat ?? null,
    check_out_lng: data.checkOutLng ?? data.check_out_lng ?? null,
    distance_from_office: data.distanceFromOffice ?? data.distance_from_office ?? null,
  };
  const { data: row, error } = await supabase
    .from('attendance')
    .upsert(dbData, { onConflict: 'employee_id,date' })
    .select('*, employees(first_name, last_name, avatar)')
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/attendance');
  return mapAttendance(row as unknown as AttendanceRowWithEmployee);
}

export async function updateAttendanceRecord(
  id: string,
  data: {
    checkIn?: string;
    checkOut?: string;
    status?: string;
    workHours?: number;
    notes?: string;
  },
) {
  const supabase = await createClient();
  // Load the row's date so the missing-checkout rule can apply to past days
  // edited to have a check-in but no check-out.
  let rowDate: string | null = null;
  try {
    const { data: existing } = await supabase
      .from('attendance')
      .select('date, check_in, check_out, status')
      .eq('id', id)
      .maybeSingle();
    rowDate = (existing as { date?: string } | null)?.date ?? null;
    const effCheckIn = data.checkIn !== undefined ? data.checkIn || null : (existing as { check_in?: string | null } | null)?.check_in ?? null;
    const effCheckOut = data.checkOut !== undefined ? data.checkOut || null : (existing as { check_out?: string | null } | null)?.check_out ?? null;
    const effStatus = (data.status ?? (existing as { status?: string } | null)?.status ?? '') as string;
    if (
      rowDate &&
      rowDate < companyDateStr() &&
      effCheckIn &&
      !effCheckOut &&
      (effStatus === 'Present' || effStatus === 'Late')
    ) {
      data = { ...data, status: 'Half Day' };
      if (!(Number(data.workHours) > 0)) {
        data = { ...data, workHours: 4 };
      }
    }
  } catch {
    // Best-effort only — fall through to the plain update.
  }
  const dbData: Database['public']['Tables']['attendance']['Update'] = {};
  if (data.checkIn !== undefined) dbData.check_in = data.checkIn || null;
  if (data.checkOut !== undefined) dbData.check_out = data.checkOut || null;
  if (data.status !== undefined) dbData.status = data.status as Database['public']['Tables']['attendance']['Update']['status'];
  if (data.workHours !== undefined) dbData.work_hours = data.workHours;
  if (data.notes !== undefined) dbData.notes = data.notes || null;

  const { error } = await supabase
    .from('attendance')
    .update(dbData)
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/attendance');
}

export async function deleteAttendanceRecord(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('attendance').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/attendance');
}

/* ------------------------------------------------------------------ */
/*  Midnight rule: auto-close days left open overnight                  */
/* ------------------------------------------------------------------ */

/**
 * Best-effort close of one employee's stale open days (checked in but never
 * checked out, date before `beforeDate`). Marks them 'Half Day' (4h) and
 * never touches days already checked out. Swallows errors so it can run
 * inside interactive check-in/out flows without breaking them.
 */
async function closeStaleOpenDays(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeId: string,
  beforeDate: string,
): Promise<number> {
  try {
    const { data: stale } = await supabase
      .from('attendance')
      .select('id')
      .eq('employee_id', employeeId)
      .lt('date', beforeDate)
      .not('check_in', 'is', null)
      .is('check_out', null)
      .in('status', ['Present', 'Late']);
    if (!stale?.length) return 0;
    const { error } = await supabase
      .from('attendance')
      .update({ status: 'Half Day', work_hours: 4 })
      .in('id', stale.map((r) => r.id));
    if (error) return 0;
    return stale.length;
  } catch {
    return 0;
  }
}

/**
 * Midnight auto-close (session-independent).
 *
 * Closes every attendance row dated before `asOfDate` (default: today) that
 * has a check-in but no check-out, marking it 'Half Day' so it counts as
 * half leave in stats and payroll. Rows already checked out are never
 * touched. Runs with the service role so it works from a scheduler with no
 * user session (logged out / browser closed).
 */
export async function autoCloseOpenAttendance(
  asOfDate?: string,
): Promise<{ closed: number; date: string }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error(
      'SUPABASE_SECRET_KEY missing. Add it (server-only, no NEXT_PUBLIC prefix) to .env.local and restart, then retry.',
    );
  }
  const svc = createServiceClient<Database>(url, secret);
  const today = asOfDate ?? companyDateStr();

  const { data: open, error: fetchErr } = await svc
    .from('attendance')
    .select('id')
    .lt('date', today)
    .not('check_in', 'is', null)
    .is('check_out', null)
    .in('status', ['Present', 'Late']);
  if (fetchErr) throw new Error(fetchErr.message);
  if (!open?.length) return { closed: 0, date: today };

  const ids = open.map((r) => r.id);
  const { error: updErr } = await svc
    .from('attendance')
    .update({ status: 'Half Day', work_hours: 4 })
    .in('id', ids);
  if (updErr) throw new Error(updErr.message);

  try {
    revalidatePath('/attendance');
  } catch {
    // ignore revalidation errors (e.g. cron context)
  }
  return { closed: ids.length, date: today };
}

/* ------------------------------------------------------------------ */
/*  Employee Self Check-In / Check-Out                                 */
/* ------------------------------------------------------------------ */

export async function selfCheckInOut(
  employeeId: string,
  date: string,
  action: 'check_in' | 'check_out'
): Promise<AttendanceRecord> {
  const supabase = await createClient();

  // Get existing record for today (upsert uses onConflict: employee_id,date)
  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .single();

  // Lazy midnight rule: close this employee's older open days as Half Day
  // first, so a missed checkout never blocks a fresh check-in and stale
  // rows are corrected even if the midnight scheduler hasn't run yet.
  await closeStaleOpenDays(supabase, employeeId, date);

  // Company wall time — the server clock is UTC, so `new Date()` here would
  // stamp 5 hours behind (and break late/early rules built on office hours).
  const timeStr = companyTimeStr(); // HH:MM

  // Day-close rule: once checked out, the day is locked — no re-check-in
  // (and no second checkout) via self-service. Corrections go through HR.
  if (existing?.check_out) {
    if (action === 'check_in') {
      throw new Error('You have already checked out for today. Check-in is closed for the day — please contact HR if this is a mistake.');
    }
    throw new Error('You have already checked out for today.');
  }

  const updateData: Database['public']['Tables']['attendance']['Update'] = {};
  if (action === 'check_in') {
    updateData.check_in = timeStr;
    // If no record exists, set status to Present
    if (!existing) updateData.status = 'Present';
  } else {
    updateData.check_out = timeStr;
    // Early-checkout → Half Day rule: leaving 15+ min before the office
    // off time counts as half leave (payroll deducts Half Day as 0.5 day).
    const currentStatus = (existing?.status as string) || 'Present';
    if (
      (currentStatus === 'Present' || currentStatus === 'Late') &&
      isEarlyHalfDayCheckout(timeStr)
    ) {
      updateData.status = 'Half Day';
    }
  }

  // Calculate work hours if both check_in and check_out exist
  const checkIn = action === 'check_in' ? timeStr : existing?.check_in;
  const checkOut = action === 'check_out' ? timeStr : existing?.check_out;
  if (checkIn && checkOut) {
    const inMin = parseInt(checkIn.split(':')[0], 10) * 60 + parseInt(checkIn.split(':')[1], 10);
    const outMin = parseInt(checkOut.split(':')[0], 10) * 60 + parseInt(checkOut.split(':')[1], 10);
    if (outMin > inMin) {
      updateData.work_hours = Math.round(((outMin - inMin) / 60) * 10) / 10;
    }
  }
  // Keep the ACTUAL elapsed hours when both times are valid (e.g. 10:14 →
  // 16:44 = 6.5h). The 4-hour value is only a Half Day fallback for days with
  // no usable in/out pair; `status` alone drives the 0.5-day payroll deduction.
  if (updateData.status === 'Half Day' && updateData.work_hours == null) {
    updateData.work_hours = 4;
  }

  const { data, error } = await supabase
    .from('attendance')
    .upsert(
      { employee_id: employeeId, date, ...updateData },
      { onConflict: 'employee_id,date' }
    )
    .select('*, employees(first_name, last_name, avatar)')
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/attendance');
  return mapAttendance(data as unknown as AttendanceRowWithEmployee);
}

/* ------------------------------------------------------------------ */
/*  Corrections                                                        */
/* ------------------------------------------------------------------ */

export async function getCorrections() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance_corrections')
    .select('id, employee_id, date, requested_status, requested_check_in, requested_check_out, reason, status, employees(first_name, last_name, avatar)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data || []) as unknown as CorrectionRowWithEmployee[]).map((row) => {
    const emp = Array.isArray(row.employees) ? row.employees[0] : row.employees;
    const employeeName = emp
      ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
      : 'Unknown';

    return {
      id: row.id,
      employeeId: row.employee_id,
      employeeName,
      employeeAvatar: emp?.avatar ?? undefined,
      date: row.date,
      currentStatus: '',
      requestedStatus: row.requested_status || '',
      requestedCheckIn: row.requested_check_in || undefined,
      requestedCheckOut: row.requested_check_out || undefined,
      reason: row.reason || '',
      status: (row.status || 'Pending') as 'Pending' | 'Approved' | 'Rejected',
    };
  });
}

export async function createCorrection(data: CorrectionInsert) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('attendance_corrections')
    .insert([data]);
  if (error) throw new Error(error.message);
  revalidatePath('/attendance');
}

export async function approveCorrection(id: string) {
  const supabase = await createClient();
  const { data: correction, error: fetchErr } = await supabase
    .from('attendance_corrections')
    .select('*')
    .eq('id', id)
    .single();
  if (fetchErr) throw new Error(fetchErr.message);

  const { error: updateAttErr } = await supabase.from('attendance').upsert(
    {
      employee_id: correction.employee_id,
      date: correction.date,
      check_in: correction.requested_check_in,
      check_out: correction.requested_check_out,
      status: (correction.requested_status as AttendanceStatus) || 'Present',
    },
    { onConflict: 'employee_id,date' },
  );
  if (updateAttErr) throw new Error(updateAttErr.message);

  const { error: updErr } = await supabase
    .from('attendance_corrections')
    .update({ status: 'Approved' })
    .eq('id', id);
  if (updErr) throw new Error(updErr.message);

  revalidatePath('/attendance');
}

export async function rejectCorrection(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('attendance_corrections')
    .update({ status: 'Rejected' })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/attendance');
}

export async function updateCorrectionStatus(
  id: string,
  status: 'Approved' | 'Rejected',
) {
  if (status === 'Approved') {
    return approveCorrection(id);
  } else {
    return rejectCorrection(id);
  }
}

/* ------------------------------------------------------------------ */
/*  Holidays                                                           */
/* ------------------------------------------------------------------ */

export async function getHolidays() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('holidays')
    .select('id, name, date, type, is_recurring')
    .order('date', { ascending: true });
  if (error) throw new Error(error.message);
  return ((data || []) as unknown as HolidayRowLike[]).map((row) => ({
    id: row.id,
    name: row.name,
    date: row.date,
    type: (row.type || 'Public') as 'Public' | 'Optional' | 'Company',
    isRecurring: row.is_recurring ?? false,
  }));
}

export async function createHoliday(data: {
  name: string;
  date: string;
  type: string;
  isRecurring?: boolean;
}) {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from('holidays')
    .insert([{ name: data.name, date: data.date, type: data.type, is_recurring: data.isRecurring ?? false }])
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/holidays');
  revalidatePath('/attendance');
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    type: (row.type || 'Public') as 'Public' | 'Optional' | 'Company',
    isRecurring: row.is_recurring ?? false,
  };
}

export async function deleteHoliday(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('holidays').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/holidays');
  revalidatePath('/attendance');
}

export interface CheckInWithLocationResult {
  success: boolean;
  record?: AttendanceRecord;
  error?: string;
  distance?: number;
  withinRadius?: boolean;
}

export async function checkInWithLocation(data: {
  employeeId: string;
  date: string;
  checkIn: string;
  latitude: number;
  longitude: number;
}): Promise<CheckInWithLocationResult> {
  try {
    const supabase = await createClient();
    const officeConfig = getOfficeLocationConfig();
    const employeeLocation = { latitude: data.latitude, longitude: data.longitude };
    const officeLocation = { latitude: officeConfig.latitude, longitude: officeConfig.longitude };

    const distance = calculateDistance(employeeLocation, officeLocation);
    const withinRadius = distance <= officeConfig.radiusMeters;

    if (!withinRadius) {
      return {
        success: false,
        error: `You are ${Math.round(distance)}m away from the office. Please move within ${officeConfig.radiusMeters}m of the office to check in.`,
        distance: Math.round(distance),
        withinRadius: false,
      };
    }

    if (!data.employeeId) {
      return { success: false, error: 'Unable to identify employee. Please sign in again and try.' };
    }

    // Resolve to a real employees.id (callers sometimes pass the auth user id).
    let employeeId = data.employeeId;
    const { data: byId } = await supabase.from('employees').select('id').eq('id', data.employeeId).maybeSingle();
    if (!byId) {
      const { data: byUser } = await supabase.from('employees').select('id').eq('user_id', data.employeeId).maybeSingle();
      if (byUser) employeeId = byUser.id;
    }
    if (!employeeId) {
      return { success: false, error: 'Employee record not found. Please contact HR.' };
    }

    // Day-close rule: once checked out, check-in is closed for the day.
    const { data: todayExisting } = await supabase
      .from('attendance')
      .select('check_in, check_out')
      .eq('employee_id', employeeId)
      .eq('date', data.date)
      .maybeSingle();
    if (todayExisting?.check_out) {
      return { success: false, error: 'You have already checked out for today. Check-in is closed for the day — please contact HR if this is a mistake.' };
    }

    // Company wall time — the server clock is UTC.
    const checkInTime = companyTimeStr();
    const status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Holiday' | 'Weekend' = 'Present';

    // Lazy midnight rule: close this employee's older open days as Half Day.
    await closeStaleOpenDays(supabase, employeeId, data.date);

    const baseData = {
      employee_id: employeeId,
      date: data.date,
      check_in: checkInTime,
      check_out: null,
      status,
      work_hours: 0,
      overtime: 0,
      notes: null,
    };
    const fullData = {
      ...baseData,
      check_in_lat: data.latitude,
      check_in_lng: data.longitude,
      check_out_lat: null,
      check_out_lng: null,
      distance_from_office: Math.round(distance),
    };

    let row: AttendanceRowWithEmployee | null = null;
    let upsertError: PostgrestError | null = null;
    const first = await supabase
      .from('attendance')
      .upsert(fullData, { onConflict: 'employee_id,date' })
      .select('*, employees(first_name, last_name, avatar)')
      .single();
    row = first.data as unknown as AttendanceRowWithEmployee | null;
    upsertError = first.error;

    // Fallback when the location migration hasn't been applied yet.
    if (upsertError && /check_in_lat|check_in_lng|check_out_lat|check_out_lng|distance_from_office|schema cache|column/i.test(upsertError.message || '')) {
      const retry = await supabase
        .from('attendance')
        .upsert(baseData, { onConflict: 'employee_id,date' })
        .select('*, employees(first_name, last_name, avatar)')
        .single();
      row = retry.data as unknown as AttendanceRowWithEmployee | null;
      upsertError = retry.error;
    }

    if (upsertError) {
      return { success: false, error: `Could not save check-in: ${upsertError.message}` };
    }
    try {
      revalidatePath('/attendance');
      revalidatePath('/dashboard');
    } catch {
      // ignore revalidation errors
    }

    return {
      success: true,
      record: mapAttendance(row as AttendanceRowWithEmployee),
      distance: Math.round(distance),
      withinRadius: true,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Check-in failed. Please try again.' };
  }
}

export async function checkOutWithLocation(data: {
  employeeId: string;
  date: string;
  checkOut: string;
  latitude: number;
  longitude: number;
}): Promise<CheckInWithLocationResult> {
  try {
    const supabase = await createClient();
    const officeConfig = getOfficeLocationConfig();
    const employeeLocation = { latitude: data.latitude, longitude: data.longitude };
    const officeLocation = { latitude: officeConfig.latitude, longitude: officeConfig.longitude };

    const distance = calculateDistance(employeeLocation, officeLocation);
    const withinRadius = distance <= officeConfig.radiusMeters;

    if (!withinRadius) {
      return {
        success: false,
        error: `You are ${Math.round(distance)}m away from the office. Please move within ${officeConfig.radiusMeters}m of the office to check out.`,
        distance: Math.round(distance),
        withinRadius: false,
      };
    }

    if (!data.employeeId) {
      return { success: false, error: 'Unable to identify employee. Please sign in again and try.' };
    }

    let employeeId = data.employeeId;
    const { data: byId } = await supabase.from('employees').select('id').eq('id', data.employeeId).maybeSingle();
    if (!byId) {
      const { data: byUser } = await supabase.from('employees').select('id').eq('user_id', data.employeeId).maybeSingle();
      if (byUser) employeeId = byUser.id;
    }

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', data.date)
      .maybeSingle();

    // Day-close rule: a second checkout is rejected — the day is locked
    // after the first checkout. Corrections go through HR.
    if (existing?.check_out) {
      return { success: false, error: 'You have already checked out for today. Please contact HR if this needs correction.' };
    }

    const checkInTime = existing?.check_in;
    let workHours = 0;
    if (checkInTime) {
      const [inH, inM] = checkInTime.split(':').map(Number);
      const [outH, outM] = data.checkOut.split(':').map(Number);
      if ([inH, inM, outH, outM].every((n) => Number.isFinite(n))) {
        const inMinutes = inH * 60 + inM;
        const outMinutes = outH * 60 + outM;
        workHours = Math.round(((outMinutes - inMinutes) / 60) * 10) / 10;
      }
    }

    const status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Holiday' | 'Weekend' =
      (existing?.status as 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Holiday' | 'Weekend') || 'Present';

    // Early-checkout → Half Day rule: leaving 15+ min before the office
    // off time counts as half leave (payroll deducts Half Day as 0.5 day).
    const finalStatus =
      (status === 'Present' || status === 'Late') && isEarlyHalfDayCheckout(data.checkOut)
        ? 'Half Day'
        : status;

    const baseData = {
      employee_id: employeeId,
      date: data.date,
      check_in: checkInTime,
      check_out: data.checkOut,
      status: finalStatus,
      // Keep the actual elapsed hours when the times are valid; only fall back
      // to the 4-hour Half Day convention when no usable in/out pair exists.
      work_hours: workHours > 0 ? workHours : finalStatus === 'Half Day' ? 4 : 0,
      overtime: 0,
      notes: existing?.notes ?? null,
    };
    const fullData = {
      ...baseData,
      check_in_lat: existing?.check_in_lat ?? null,
      check_in_lng: existing?.check_in_lng ?? null,
      check_out_lat: data.latitude,
      check_out_lng: data.longitude,
      distance_from_office: Math.round(distance),
    };

    let row: AttendanceRowWithEmployee | null = null;
    let upsertError: PostgrestError | null = null;
    const first = await supabase
      .from('attendance')
      .upsert(fullData, { onConflict: 'employee_id,date' })
      .select('*, employees(first_name, last_name, avatar)')
      .single();
    row = first.data as unknown as AttendanceRowWithEmployee | null;
    upsertError = first.error;

    if (upsertError && /check_in_lat|check_in_lng|check_out_lat|check_out_lng|distance_from_office|schema cache|column/i.test(upsertError.message || '')) {
      const retry = await supabase
        .from('attendance')
        .upsert(baseData, { onConflict: 'employee_id,date' })
        .select('*, employees(first_name, last_name, avatar)')
        .single();
      row = retry.data as unknown as AttendanceRowWithEmployee | null;
      upsertError = retry.error;
    }

    if (upsertError) {
      return { success: false, error: `Could not save check-out: ${upsertError.message}` };
    }
    try {
      revalidatePath('/attendance');
      revalidatePath('/dashboard');
    } catch {
      // ignore revalidation errors
    }

    return {
      success: true,
      record: mapAttendance(row as AttendanceRowWithEmployee),
      distance: Math.round(distance),
      withinRadius: true,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Check-out failed. Please try again.' };
  }
}
