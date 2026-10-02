'use server';

import { createClient } from '@/lib/server';
import type { AttendanceRecord } from '@/lib/types';
import type { Database } from '@/lib/supabase/database.types';
import { effectiveAttendanceStatus } from '@/utils/date';

type EmployeeRow = Database['public']['Tables']['employees']['Row'];
type AttendanceRow = Database['public']['Tables']['attendance']['Row'];

interface AttendanceRowWithEmployee extends AttendanceRow {
  employees?: { first_name: string | null; last_name: string | null; avatar?: string | null; employee_code?: string | null } | Array<{ first_name: string | null; last_name: string | null; avatar?: string | null; employee_code?: string | null }> | null;
}

export interface ReportEmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeCode?: string;
}

/** Real employee list for the Reports employee dropdown (no dummy data). */
export async function getReportEmployees(): Promise<ReportEmployeeOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, email, employee_code')
    .order('first_name', { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Pick<EmployeeRow, 'id' | 'first_name' | 'last_name' | 'email' | 'employee_code'>[]).map((r: Pick<EmployeeRow, 'id' | 'first_name' | 'last_name' | 'email' | 'employee_code'>) => ({
    id: r.id,
    firstName: r.first_name ?? '',
    lastName: r.last_name ?? '',
    email: r.email ?? '',
    employeeCode: r.employee_code ?? undefined,
  }));
}

function mapAttendance(db: AttendanceRowWithEmployee): AttendanceRecord {
  const effectiveStatus = effectiveAttendanceStatus(
    db.date,
    db.check_in,
    db.check_out,
    db.status,
  ) as AttendanceRecord['status'];
  const storedHours = db.work_hours != null ? Number(db.work_hours) || 0 : 0;
  // Supabase may return the joined employee as an object or a one-item array
  // depending on the relationship — normalize once (same as attendance.ts).
  const emp = Array.isArray(db.employees) ? db.employees[0] : db.employees;
  return {
    id: db.id,
    employeeId: db.employee_id,
    employeeCode: emp?.employee_code ?? undefined,
    employeeName: emp?.first_name ? `${emp.first_name} ${emp.last_name}` : '',
    employeeAvatar: emp?.avatar ?? undefined,
    date: db.date,
    checkIn: db.check_in ?? '',
    checkOut: db.check_out ?? '',
    status: effectiveStatus,
    workHours: effectiveStatus === 'Half Day' && storedHours <= 0 ? 4 : storedHours,
    overtime: db.overtime ?? 0,
    notes: db.notes ?? undefined,
  };
}

/** Real attendance rows from the database for one employee + date range. */
export async function getAttendanceReport(
  employeeId: string,
  from: string,
  to: string,
): Promise<AttendanceRecord[]> {
  if (!employeeId || !from || !to || from > to) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attendance')
    .select('*, employees(first_name, last_name, avatar, employee_code)')
    .eq('employee_id', employeeId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as AttendanceRowWithEmployee[]).map(mapAttendance);
}
