'use server';

import { createClient } from '@/lib/server';
import type { AttendanceRecord } from '@/lib/types';
import type { Database } from '@/lib/supabase/database.types';

type EmployeeRow = Database['public']['Tables']['employees']['Row'];
type AttendanceRow = Database['public']['Tables']['attendance']['Row'];

interface AttendanceRowWithEmployee extends AttendanceRow {
  employees?: { first_name: string | null; last_name: string | null } | null;
}

export interface ReportEmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/** Real employee list for the Reports employee dropdown (no dummy data). */
export async function getReportEmployees(): Promise<ReportEmployeeOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('employees')
    .select('id, first_name, last_name, email')
    .order('first_name', { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as Pick<EmployeeRow, 'id' | 'first_name' | 'last_name' | 'email'>[]).map((r: Pick<EmployeeRow, 'id' | 'first_name' | 'last_name' | 'email'>) => ({
    id: r.id,
    firstName: r.first_name ?? '',
    lastName: r.last_name ?? '',
    email: r.email ?? '',
  }));
}

function mapAttendance(db: AttendanceRowWithEmployee): AttendanceRecord {
  return {
    id: db.id,
    employeeId: db.employee_id,
    employeeName: db.employees?.first_name ? `${db.employees.first_name} ${db.employees.last_name}` : '',
    date: db.date,
    checkIn: db.check_in ?? '',
    checkOut: db.check_out ?? '',
    status: db.status,
    workHours: db.work_hours ?? 0,
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
    .select('*, employees(first_name, last_name)')
    .eq('employee_id', employeeId)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as AttendanceRowWithEmployee[]).map(mapAttendance);
}
