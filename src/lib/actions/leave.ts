'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { LeaveRequest, LeaveBalance, LeaveType } from '@/lib/types';

export async function getLeaveTypes(): Promise<LeaveType[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('leave_types')
    .select('*')
    .order('created_at', { ascending: true });
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

export async function getLeaveRequests(employeeId?: string): Promise<LeaveRequest[]> {
  const supabase = await createClient();
  let query = supabase
    .from('leave_requests')
    .select('*, leave_types(name), employees:employees!leave_requests_employee_id_fkey(first_name, last_name, avatar)')
    .order('created_at', { ascending: false });

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map((db: any) => ({
    id: db.id,
    employeeId: db.employee_id,
    employeeName: db.employees ? `${db.employees.first_name} ${db.employees.last_name}` : '',
    employeeAvatar: db.employees?.avatar,
    leaveType: db.leave_types?.name || '',
    startDate: db.start_date,
    endDate: db.end_date,
    days: db.days,
    reason: db.reason,
    status: db.status,
    appliedOn: db.applied_on,
    approvedBy: db.approved_by,
    comments: db.comments,
  }));
}

export async function getLeaveBalances(employeeId?: string, year?: number): Promise<LeaveBalance[]> {
  const supabase = await createClient();
  let query = supabase
    .from('leave_balances')
    .select('*, leave_types(name)');

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  if (year) {
    query = query.eq('year', year);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map((db: any) => ({
    leaveType: db.leave_types?.name || '',
    total: db.total,
    used: db.used,
    remaining: db.remaining,
    pending: db.pending,
  }));
}

export async function createLeaveRequest(data: {
  employeeId: string;
  leaveTypeId?: string;
  leaveType?: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
}): Promise<LeaveRequest> {
  const supabase = await createClient();
  
  let typeId = data.leaveTypeId;
  let typeName = data.leaveType || '';
  if (!typeId && data.leaveType) {
    const { data: lt } = await supabase.from('leave_types').select('id, name').eq('name', data.leaveType).single();
    if (lt) {
      typeId = lt.id;
      typeName = lt.name;
    }
  }

  if (!typeId) {
    const { data: lt } = await supabase.from('leave_types').select('id, name').limit(1).single();
    if (lt) {
      typeId = lt.id;
      typeName = lt.name;
    }
  }

  const appliedOn = new Date().toISOString().slice(0, 10);
  const { data: row, error: reqErr } = await supabase.from('leave_requests').insert([{
    employee_id: data.employeeId,
    leave_type_id: typeId!,
    start_date: data.startDate,
    end_date: data.endDate,
    days: data.days,
    reason: data.reason,
    status: 'Pending',
    applied_on: appliedOn,
  }]).select('*, employees:employees!leave_requests_employee_id_fkey(first_name, last_name, avatar)').single();

  if (reqErr) throw new Error(reqErr.message);

  if (typeId) {
    const currentYear = new Date(data.startDate).getFullYear();
    const { data: balData } = await supabase.from('leave_balances')
      .select('*')
      .eq('employee_id', data.employeeId)
      .eq('leave_type_id', typeId)
      .eq('year', currentYear)
      .single();

    if (balData) {
      await supabase.from('leave_balances').update({
        pending: (balData.pending || 0) + data.days
      }).eq('id', balData.id);
    }
  }

  revalidatePath('/leave');

  const r = row as any;
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : '',
    employeeAvatar: r.employees?.avatar,
    leaveType: typeName,
    startDate: r.start_date,
    endDate: r.end_date,
    days: r.days,
    reason: r.reason || '',
    status: r.status,
    appliedOn: r.applied_on,
  };
}

export async function updateLeaveStatus(id: string, status: string, approvedBy?: string, comments?: string) {
  const supabase = await createClient();
  
  const { data: req } = await supabase.from('leave_requests').select('*').eq('id', id).single();
  if (!req) throw new Error('Request not found');

  const { error } = await supabase.from('leave_requests').update({
    status: status as any,
    approved_by: approvedBy,
    comments,
  }).eq('id', id);
  if (error) throw new Error(error.message);

  if (req.status === 'Pending') {
    const currentYear = new Date(req.start_date).getFullYear();
    const { data: balData } = await supabase.from('leave_balances')
      .select('*')
      .eq('employee_id', req.employee_id)
      .eq('leave_type_id', req.leave_type_id)
      .eq('year', currentYear)
      .single();

    if (balData) {
      let updateData: any = { pending: Math.max(0, (balData.pending || 0) - req.days) };
      if (status === 'Approved') {
        updateData.used = (balData.used || 0) + req.days;
        updateData.remaining = (balData.total || 0) - updateData.used;
      }
      await supabase.from('leave_balances').update(updateData).eq('id', balData.id);
    }
  }

  revalidatePath('/leave');
}

export async function updateLeaveRequest(id: string, data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('leave_requests').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/leave');
}

export async function deleteLeaveRequest(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('leave_requests').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/leave');
}

export async function updateLeaveBalance(employeeId: string, leaveTypeId: string, total: number, used: number) {
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();
  const remaining = total - used;
  const { error } = await supabase.from('leave_balances').upsert({
    employee_id: employeeId,
    leave_type_id: leaveTypeId,
    year: currentYear,
    total,
    used,
    remaining,
    pending: 0,
  }, { onConflict: 'employee_id,leave_type_id,year' });
  if (error) throw new Error(error.message);
  revalidatePath('/leave');
}
