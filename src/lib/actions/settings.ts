'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { Department, Designation, Branch, LeaveType } from '@/lib/types';
import { COMPANY_DEFAULTS, type CompanySettings } from '@/lib/company-settings';

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

/* ---------- Company settings (stored in DB, applied system-wide) ---------- */

const COMPANY_KEY_MAP: Record<keyof CompanySettings, string> = {
  companyName: 'company_name',
  regNo: 'company_reg_no',
  email: 'company_email',
  phone: 'company_phone',
  address: 'company_address',
  website: 'company_website',
  taxId: 'company_tax_id',
};

export async function getCompanySettings(): Promise<CompanySettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', Object.values(COMPANY_KEY_MAP));
  if (error) throw new Error(error.message);
  const map = new Map((data || []).map((r: any) => [String(r.key), String(r.value ?? '')]));
  const out = { ...COMPANY_DEFAULTS };
  (Object.keys(COMPANY_KEY_MAP) as (keyof CompanySettings)[]).forEach((field) => {
    const v = map.get(COMPANY_KEY_MAP[field]);
    if (v !== undefined && v !== '') out[field] = v;
  });
  return out;
}

export async function saveCompanySettings(input: CompanySettings): Promise<void> {
  const supabase = await createClient();
  const rows = (Object.keys(COMPANY_KEY_MAP) as (keyof CompanySettings)[]).map((field) => ({
    key: COMPANY_KEY_MAP[field],
    value: input[field] ?? '',
  }));
  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) throw new Error(error.message);
  // Saved centrally — bust cached pages so the new values deploy everywhere.
  revalidatePath('/settings');
  revalidatePath('/dashboard');
  revalidatePath('/');
}

/* ---------- Late-arrival → Half Day rule (attendance) ---------- */

export interface LateArrivalRuleDTO {
  graceMinutes: number;
  halfDayAfterMinutes: number;
  enabled: boolean;
}

const LATE_RULE_DEFAULTS: LateArrivalRuleDTO = {
  graceMinutes: 0,
  halfDayAfterMinutes: 0,
  enabled: true,
};

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const n = parseInt(raw ?? '', 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export async function getLateArrivalRule(): Promise<LateArrivalRuleDTO> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['attendance_grace_minutes', 'attendance_half_day_after_minutes', 'attendance_late_rule_enabled']);
  if (error) throw new Error(error.message);
  const map = new Map((data || []).map((r: any) => [r.key, String(r.value ?? '')]));
  const enabledRaw = (map.get('attendance_late_rule_enabled') || '').toLowerCase();
  return {
    graceMinutes: parsePositiveInt(map.get('attendance_grace_minutes'), LATE_RULE_DEFAULTS.graceMinutes),
    halfDayAfterMinutes: parsePositiveInt(map.get('attendance_half_day_after_minutes'), LATE_RULE_DEFAULTS.halfDayAfterMinutes),
    enabled: enabledRaw ? enabledRaw === 'true' || enabledRaw === '1' : LATE_RULE_DEFAULTS.enabled,
  };
}

export async function saveLateArrivalRule(rule: LateArrivalRuleDTO): Promise<void> {
  const grace = Math.max(0, Math.floor(rule.graceMinutes));
  const halfAfter = Math.max(0, Math.floor(rule.halfDayAfterMinutes));
  if (halfAfter < grace) {
    throw new Error('Half-day threshold cannot be less than the grace period. Set it equal to grace so any lateness is Half Day.');
  }
  const supabase = await createClient();
  const rows = [
    { key: 'attendance_grace_minutes', value: String(grace) },
    { key: 'attendance_half_day_after_minutes', value: String(halfAfter) },
    { key: 'attendance_late_rule_enabled', value: rule.enabled ? 'true' : 'false' },
  ];
  const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
  if (error) throw new Error(error.message);
  revalidatePath('/attendance');
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

export async function createBranch(input: { name: string; city?: string; address?: string }) {
  if (!input.name.trim()) throw new Error('Branch name is required.');
  const supabase = await createClient();
  const { error } = await supabase.from('branches').insert([{
    name: input.name.trim(),
    city: input.city?.trim() || null,
    address: input.address?.trim() || null,
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

export async function createShift(input: { name: string; startTime?: string; endTime?: string }) {
  if (!input.name.trim()) throw new Error('Shift name is required.');
  const supabase = await createClient();
  const { error } = await supabase.from('shifts').insert([{
    name: input.name.trim(),
    start_time: input.startTime || null,
    end_time: input.endTime || null,
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

export async function createLeaveType(input: {
  name: string;
  daysAllowed: number;
  period: 'month' | 'year';
  carryForward?: boolean;
  description?: string;
}) {
  if (!input.name.trim()) throw new Error('Leave type name is required.');
  if (!Number.isFinite(input.daysAllowed) || input.daysAllowed < 0) {
    throw new Error('Days allowed must be 0 or more.');
  }
  const supabase = await createClient();
  const { error } = await supabase.from('leave_types').insert([{
    name: input.name.trim(),
    days_allowed: Math.floor(input.daysAllowed),
    period: input.period,
    carry_forward: input.carryForward ?? false,
    color: '#024fa7',
    description: input.description?.trim() || null,
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
