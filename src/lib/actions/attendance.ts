'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { AttendanceRecord } from '@/lib/types';
import { calculateDistance, getOfficeLocationConfig } from '@/lib/location';

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

function mapAttendance(db: any): AttendanceRecord {
  if (!db) {
    throw new Error('No attendance record returned from database.');
  }
  const emp = Array.isArray(db.employees) ? db.employees[0] : db.employees;
  const employeeName = emp
    ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
    : (db.employees?.first_name ? `${db.employees.first_name} ${db.employees.last_name}` : '');

  return {
    id: db.id,
    employeeId: db.employee_id,
    employeeName,
    date: db.date,
    checkIn: db.check_in ? db.check_in.slice(0, 5) : '',
    checkOut: db.check_out ? db.check_out.slice(0, 5) : '',
    status: db.status,
    workHours: db.work_hours != null ? Number(db.work_hours) || 0 : 0,
    overtime: db.overtime != null ? Number(db.overtime) || 0 : 0,
    notes: db.notes ?? undefined,
    checkInLat: db.check_in_lat,
    checkInLng: db.check_in_lng,
    checkOutLat: db.check_out_lat,
    checkOutLng: db.check_out_lng,
    distanceFromOffice: db.distance_from_office,
  };
}

/* ------------------------------------------------------------------ */
/*  Queries                                                            */
/* ------------------------------------------------------------------ */

const ATTENDANCE_LIST_COLUMNS =
  'id, employee_id, date, check_in, check_out, status, work_hours, overtime, notes, check_in_lat, check_in_lng, check_out_lat, check_out_lng, distance_from_office, employees(first_name, last_name)';

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
  return (data || []).map(mapAttendance);
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
  return (data || []).map(mapAttendance);
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
  return (data || []).map(mapAttendance);
}

/** Compute live attendance stats for a given date (defaults to today). */
export async function getAttendanceStats(date?: string) {
  const supabase = await createClient();
  const targetDate = date ?? new Date().toISOString().slice(0, 10);

  // Count-only queries in parallel — the old version downloaded every row
  // for the date and counted in JS.
  const [
    { count: presentToday },
    { count: absentToday },
    { count: lateToday },
    { count: onLeaveToday },
  ] = await Promise.all([
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', targetDate).eq('status', 'Present'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', targetDate).eq('status', 'Absent'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', targetDate).eq('status', 'Late'),
    supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', targetDate).eq('status', 'Leave'),
  ]);

  return {
    presentToday: presentToday ?? 0,
    absentToday: absentToday ?? 0,
    lateToday: lateToday ?? 0,
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
  const today = new Date().toISOString().slice(0, 10);

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
      .select('id, employee_id, date, requested_status, requested_check_in, requested_check_out, reason, status, employees(first_name, last_name)')
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

  return {
    employees: ((employeesRes.data ?? []) as Array<{ id: string; first_name: string; last_name: string; email: string }>).map((e) => ({
      id: e.id,
      firstName: e.first_name ?? '',
      lastName: e.last_name ?? '',
      email: e.email ?? '',
    })),
    records: ((recordsRes.data ?? []) as unknown[]).map(mapAttendance),
    corrections: ((correctionsRes.data ?? []) as Array<Record<string, unknown>>).map((row: any) => {
      const emp = Array.isArray(row.employees) ? row.employees[0] : row.employees;
      return {
        id: row.id,
        employeeId: row.employee_id,
        employeeName: emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : 'Unknown',
        date: row.date,
        currentStatus: '',
        requestedStatus: row.requested_status || '',
        requestedCheckIn: row.requested_check_in || undefined,
        requestedCheckOut: row.requested_check_out || undefined,
        reason: row.reason || '',
        status: (row.status || 'Pending') as 'Pending' | 'Approved' | 'Rejected',
      };
    }),
    holidays: ((holidaysRes.data ?? []) as Array<Record<string, unknown>>).map((row: any) => ({
      id: row.id,
      name: row.name,
      date: row.date,
      type: (row.type || 'Public') as 'Public' | 'Optional' | 'Company',
      isRecurring: row.is_recurring ?? false,
    })),
    auditLogs: ((auditRes.data ?? []) as Array<Record<string, unknown>>).map((row: any) => ({
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
  data: any,
): Promise<AttendanceRecord> {
  const supabase = await createClient();
  const dbData: any = {
    employee_id: data.employeeId || data.employee_id,
    date: data.date,
    check_in: data.checkIn ?? data.check_in ?? null,
    check_out: data.checkOut ?? data.check_out ?? null,
    status: data.status,
    work_hours: data.workHours ?? data.work_hours ?? 0,
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
    .select('*, employees(first_name, last_name)')
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/attendance');
  return mapAttendance(row);
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
  const dbData: any = {};
  if (data.checkIn !== undefined) dbData.check_in = data.checkIn || null;
  if (data.checkOut !== undefined) dbData.check_out = data.checkOut || null;
  if (data.status !== undefined) dbData.status = data.status;
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

  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 5); // HH:MM

  const updateData: Record<string, any> = {};
  if (action === 'check_in') {
    updateData.check_in = timeStr;
    // If no record exists, set status to Present
    if (!existing) updateData.status = 'Present';
  } else {
    updateData.check_out = timeStr;
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

  const { data, error } = await supabase
    .from('attendance')
    .upsert(
      { employee_id: employeeId, date, ...updateData },
      { onConflict: 'employee_id,date' }
    )
    .select('*, employees(first_name, last_name)')
    .single();

  if (error) throw new Error(error.message);
  revalidatePath('/attendance');
  return mapAttendance(data);
}

/* ------------------------------------------------------------------ */
/*  Corrections                                                        */
/* ------------------------------------------------------------------ */

export async function getCorrections() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance_corrections')
    .select('id, employee_id, date, requested_status, requested_check_in, requested_check_out, reason, status, employees(first_name, last_name)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => {
    const emp = Array.isArray(row.employees) ? row.employees[0] : row.employees;
    const employeeName = emp
      ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
      : 'Unknown';

    return {
      id: row.id,
      employeeId: row.employee_id,
      employeeName,
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

export async function createCorrection(data: any) {
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
      status: (correction.requested_status as any) || 'Present',
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
  return (data || []).map((row: any) => ({
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

    const now = new Date();
    const checkInTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const status: 'Present' | 'Absent' | 'Late' | 'Half Day' | 'Leave' | 'Holiday' | 'Weekend' = 'Present';

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

    let row: any = null;
    let upsertError: any = null;
    const first = await supabase
      .from('attendance')
      .upsert(fullData as any, { onConflict: 'employee_id,date' })
      .select('*, employees(first_name, last_name)')
      .single();
    row = first.data;
    upsertError = first.error;

    // Fallback when the location migration hasn't been applied yet.
    if (upsertError && /check_in_lat|check_in_lng|check_out_lat|check_out_lng|distance_from_office|schema cache|column/i.test(upsertError.message || '')) {
      const retry = await supabase
        .from('attendance')
        .upsert(baseData as any, { onConflict: 'employee_id,date' })
        .select('*, employees(first_name, last_name)')
        .single();
      row = retry.data;
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
      record: mapAttendance(row),
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

    const baseData = {
      employee_id: employeeId,
      date: data.date,
      check_in: checkInTime,
      check_out: data.checkOut,
      status,
      work_hours: workHours,
      overtime: 0,
      notes: existing?.notes ?? null,
    };
    const fullData = {
      ...baseData,
      check_in_lat: (existing as any)?.check_in_lat ?? null,
      check_in_lng: (existing as any)?.check_in_lng ?? null,
      check_out_lat: data.latitude,
      check_out_lng: data.longitude,
      distance_from_office: Math.round(distance),
    };

    let row: any = null;
    let upsertError: any = null;
    const first = await supabase
      .from('attendance')
      .upsert(fullData as any, { onConflict: 'employee_id,date' })
      .select('*, employees(first_name, last_name)')
      .single();
    row = first.data;
    upsertError = first.error;

    if (upsertError && /check_in_lat|check_in_lng|check_out_lat|check_out_lng|distance_from_office|schema cache|column/i.test(upsertError.message || '')) {
      const retry = await supabase
        .from('attendance')
        .upsert(baseData as any, { onConflict: 'employee_id,date' })
        .select('*, employees(first_name, last_name)')
        .single();
      row = retry.data;
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
      record: mapAttendance(row),
      distance: Math.round(distance),
      withinRadius: true,
    };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Check-out failed. Please try again.' };
  }
}
