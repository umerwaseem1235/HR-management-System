'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { AttendanceRecord } from '@/lib/types';

function mapAttendance(db: any): AttendanceRecord {
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
