'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { Department, Designation, Branch, LeaveType } from '@/lib/types';

export async function getSettings(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('settings').select('key, value');
  if (error) throw new Error(error.message);
  
  const settings: Record<string, string> = {};
  for (const item of (data || [])) {
    settings[item.key] = typeof item.value === 'string' ? item.value : JSON.stringify(item.value ?? '');
  }
  return settings;
}

export async function updateSetting(key: string, value: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('settings').upsert({ key, value }, { onConflict: 'key' });
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function getDepartments(): Promise<Department[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('departments').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data || []).map((db: any) => ({
    id: db.id,
    name: db.name,
    head: db.head,
    employeeCount: db.employee_count || 0,
  }));
}

export async function createDepartment(name: string, head?: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('departments').insert([{ name, head, employee_count: 0 }]);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function updateDepartment(id: string, data: { name?: string; head?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from('departments').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function deleteDepartment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('departments').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function getDesignations(): Promise<Designation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('designations').select('*, departments(name)').order('name');
  if (error) throw new Error(error.message);
  return (data || []).map((db: any) => ({
    id: db.id,
    name: db.name,
    department: db.departments?.name || '',
  }));
}

export async function createDesignation(name: string, departmentId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('designations').insert([{ name, department_id: departmentId }]);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function getBranches(): Promise<Branch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('branches').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data || []).map((db: any) => ({
    id: db.id,
    name: db.name,
    address: db.address,
    city: db.city,
  }));
}

export async function getShifts() {
  const supabase = await createClient();
  const { data, error } = await supabase.from('shifts').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data || []).map((db: any) => ({
    id: db.id,
    name: db.name,
    startTime: db.start_time,
    endTime: db.end_time,
  }));
}

export async function getLeaveTypes(): Promise<LeaveType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('leave_types').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data || []).map((db: any) => ({
    id: db.id,
    name: db.name,
    daysAllowed: db.days_allowed,
    carryForward: db.carry_forward,
    color: db.color,
    period: db.period,
    description: db.description,
  }));
}

export async function createBranch(data: { name: string; city?: string; address?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from('branches').insert([{
    name: data.name,
    city: data.city || null,
    address: data.address || null,
  }]);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function deleteBranch(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('branches').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function createShift(data: { name: string; startTime: string; endTime: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from('shifts').insert([{
    name: data.name,
    start_time: data.startTime,
    end_time: data.endTime,
  }]);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function deleteShift(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('shifts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function createLeaveType(data: {
  name: string;
  daysAllowed: number;
  carryForward?: boolean;
  color?: string;
  period?: 'month' | 'year';
  description?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from('leave_types').insert([{
    name: data.name,
    days_allowed: data.daysAllowed,
    carry_forward: data.carryForward ?? false,
    color: data.color || '#024fa7',
    period: data.period || 'year',
    description: data.description || null,
  }]);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}

export async function deleteLeaveType(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('leave_types').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/settings');
}
