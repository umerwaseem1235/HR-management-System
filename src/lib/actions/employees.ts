'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { Employee } from '@/lib/types';

function mapEmployee(db: any): Employee {
  return {
    id: db.id,
    employeeCode: db.employee_code,
    firstName: db.first_name,
    lastName: db.last_name,
    email: db.email,
    phone: db.phone,
    avatar: db.avatar,
    dateOfBirth: db.date_of_birth,
    gender: db.gender,
    address: db.address,
    city: db.city,
    country: db.country,
    emergencyContactName: db.emergency_contact_name,
    emergencyContactPhone: db.emergency_contact_phone,
    department: db.departments?.name || '',
    designation: db.designations?.name || '',
    branch: db.branches?.name || '',
    shift: db.shifts?.name || '',
    reportingManager: db.reporting_manager?.first_name 
      ? `${db.reporting_manager.first_name} ${db.reporting_manager.last_name}`
      : '',
    employmentType: db.employment_type,
    joiningDate: db.joining_date,
    probationEndDate: db.probation_end_date,
    confirmationDate: db.confirmation_date,
    status: db.status,
    bankName: db.bank_name,
    bankAccount: db.bank_account,
    taxId: db.tax_id,
    salary: db.salary,
  };
}

export async function getEmployees(): Promise<Employee[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      departments(name),
      designations(name),
      branches(name),
      shifts(name),
      reporting_manager:employees(first_name, last_name)
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapEmployee);
}

export async function getEmployee(id: string): Promise<Employee> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      departments(name),
      designations(name),
      branches(name),
      shifts(name),
      reporting_manager:employees(first_name, last_name)
    `)
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  return mapEmployee(data);
}

export async function createEmployee(data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('employees').insert([data]);
  if (error) throw new Error(error.message);
  revalidatePath('/employees');
}

export async function updateEmployee(id: string, data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('employees').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/employees');
}

export async function deleteEmployee(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/employees');
}

export async function getEmployeeByUserId(userId: string): Promise<Employee | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      departments(name),
      designations(name),
      branches(name),
      shifts(name),
      reporting_manager:employees(first_name, last_name)
    `)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);
  if (!data) return null;
  return mapEmployee(data);
}
