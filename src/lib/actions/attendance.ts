'use server';

import { createClient } from '@/lib/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { AttendanceRecord } from '@/lib/types';
import type { Database } from '@/lib/supabase/database.types';
import { isEarlyHalfDayCheckout } from '@/utils/date';
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

export async function getAttendanceByDate(
  date: string,
): Promise<AttendanceRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select('*, employees(first_name, last_name)')
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
    .select('*, employees(first_name, last_name)')
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
    .select('*, employees(first_name, last_name)')
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

  const { data, error } = await supabase
    .from('attendance')
    .select('status')
    .eq('date', targetDate);

  if (error) throw new Error(error.message);

  const records = data || [];
  const presentToday = records.filter(
    (r: any) => r.status === 'Present',
  ).length;
  const absentToday = records.filter((r: any) => r.status === 'Absent').length;
  const lateToday = records.filter((r: any) => r.status === 'Late').length;
  const onLeaveToday = records.filter(
    (r: any) => r.status === 'Leave',
  ).length;

  return { presentToday, absentToday, lateToday, onLeaveToday };
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
      .in('id', stale.map((r: any) => r.id));
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
  const today = asOfDate ?? new Date().toISOString().slice(0, 10);

  const { data: open, error: fetchErr } = await svc
    .from('attendance')
    .select('id')
    .lt('date', today)
    .not('check_in', 'is', null)
    .is('check_out', null)
    .in('status', ['Present', 'Late']);
  if (fetchErr) throw new Error(fetchErr.message);
  if (!open?.length) return { closed: 0, date: today };

  const ids = open.map((r: any) => r.id);
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

  const now = new Date();
  const timeStr = now.toTimeString().slice(0, 5); // HH:MM

  // Day-close rule: once checked out, the day is locked — no re-check-in
  // (and no second checkout) via self-service. Corrections go through HR.
  if (existing?.check_out) {
    if (action === 'check_in') {
      throw new Error('You have already checked out for today. Check-in is closed for the day — please contact HR if this is a mistake.');
    }
    throw new Error('You have already checked out for today.');
  }

  const updateData: Record<string, any> = {};
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
    .select('*, employees(first_name, last_name)')
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
    .select('*')
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

    const now = new Date();
    const checkInTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
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
