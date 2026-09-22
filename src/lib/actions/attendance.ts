'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { AttendanceRecord } from '@/lib/types';

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
  const emp = Array.isArray(db.employees) ? db.employees[0] : db.employees;
  const employeeName = emp
    ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim()
    : '';

  return {
    id: db.id,
    employeeId: db.employee_id,
    employeeName,
    date: db.date,
    checkIn: db.check_in ? db.check_in.slice(0, 5) : '',
    checkOut: db.check_out ? db.check_out.slice(0, 5) : '',
    status: db.status,
    workHours: Number(db.work_hours) || 0,
    overtime: Number(db.overtime) || 0,
    notes: db.notes ?? undefined,
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
