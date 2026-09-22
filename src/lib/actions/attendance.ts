'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { AttendanceRecord } from '@/lib/types';
import { calculateDistance, getOfficeLocationConfig } from '@/lib/location';

function mapAttendance(db: any): AttendanceRecord {
  if (!db) {
    throw new Error('No attendance record returned from database.');
  }
  return {
    id: db.id,
    employeeId: db.employee_id,
    employeeName: db.employees?.first_name ? `${db.employees.first_name} ${db.employees.last_name}` : '',
    date: db.date,
    checkIn: db.check_in,
    checkOut: db.check_out,
    status: db.status,
    workHours: db.work_hours,
    overtime: db.overtime,
    notes: db.notes,
    checkInLat: db.check_in_lat,
    checkInLng: db.check_in_lng,
    checkOutLat: db.check_out_lat,
    checkOutLng: db.check_out_lng,
    distanceFromOffice: db.distance_from_office,
  };
}

export async function getAttendanceByDate(date: string): Promise<AttendanceRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select('*, employees(first_name, last_name)')
    .eq('date', date)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapAttendance);
}

export async function getAttendanceByEmployee(employeeId: string, year?: number, month?: number): Promise<AttendanceRecord[]> {
  const supabase = await createClient();
  let query = supabase
    .from('attendance')
    .select('*, employees(first_name, last_name)')
    .eq('employee_id', employeeId)
    .order('date', { ascending: true });

  if (year && month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    query = query.gte('date', startDate).lte('date', endDate);
  }
  
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(mapAttendance);
}

export async function getAllAttendance(year?: number, month?: number): Promise<AttendanceRecord[]> {
  const supabase = await createClient();
  let query = supabase
    .from('attendance')
    .select('*, employees(first_name, last_name)')
    .order('date', { ascending: true });

  if (year && month) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    query = query.gte('date', startDate).lte('date', endDate);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map(mapAttendance);
}

export async function createAttendanceRecord(data: any): Promise<AttendanceRecord> {
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

export async function updateAttendanceRecord(id: string, data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('attendance').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/attendance');
}

export async function getCorrections() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance_corrections')
    .select('*, employees(first_name, last_name)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employees ? `${row.employees.first_name} ${row.employees.last_name}` : 'Unknown',
    date: row.date,
    currentStatus: '',
    requestedStatus: row.requested_status || '',
    requestedCheckIn: row.requested_check_in || undefined,
    requestedCheckOut: row.requested_check_out || undefined,
    reason: row.reason || '',
    status: (row.status || 'Pending') as 'Pending' | 'Approved' | 'Rejected',
  }));
}

export async function createCorrection(data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('attendance_corrections').insert([data]);
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

  const { error: updateAttErr } = await supabase
    .from('attendance')
    .upsert({
      employee_id: correction.employee_id,
      date: correction.date,
      check_in: correction.requested_check_in,
      check_out: correction.requested_check_out,
      status: (correction.requested_status as any) || 'Present',
    }, { onConflict: 'employee_id,date' });
  if (updateAttErr) throw new Error(updateAttErr.message);

  const { error: updErr } = await supabase.from('attendance_corrections').update({ status: 'Approved' }).eq('id', id);
  if (updErr) throw new Error(updErr.message);
  
  revalidatePath('/attendance');
}

export async function rejectCorrection(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('attendance_corrections').update({ status: 'Rejected' }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/attendance');
}

export async function updateCorrectionStatus(id: string, status: 'Approved' | 'Rejected') {
  if (status === 'Approved') {
    return approveCorrection(id);
  } else {
    return rejectCorrection(id);
  }
}

export async function getHolidays() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('holidays').select('*').order('date', { ascending: true });
  if (error) throw new Error(error.message);
  return data;
}

export async function createHoliday(data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('holidays').insert([data]);
  if (error) throw new Error(error.message);
  revalidatePath('/attendance');
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
