'use server';

import { createClient } from '@/lib/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/supabase/database.types';
import type { LeaveRequest, LeaveBalance, LeaveType } from '@/lib/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Guarantees one balance row per (active employee, leave type) for `year`,
 * creating missing rows with usage computed from this year's requests.
 * Without this, each January starts with zero rows: quota cards render
 * stale fallbacks and admin quota edits appear to do nothing.
 */
async function ensureYearBalances(
  supabase: Awaited<ReturnType<typeof createClient>>,
  year: number,
): Promise<void> {
  const [{ data: employees }, { data: types }, { data: existing }] = await Promise.all([
    supabase.from('employees').select('id').eq('status', 'Active'),
    supabase.from('leave_types').select('id, days_allowed'),
    supabase.from('leave_balances').select('employee_id, leave_type_id').eq('year', year),
  ]);
  if (!employees?.length || !types?.length) return;

  const have = new Set((existing || []).map((r: any) => `${r.employee_id}|${r.leave_type_id}`));
  const missing: { employee_id: string; leave_type_id: string; total: number }[] = [];
  for (const t of types as any[]) {
    for (const e of employees as any[]) {
      if (!have.has(`${e.id}|${t.id}`)) {
        missing.push({ employee_id: e.id, leave_type_id: t.id, total: t.days_allowed ?? 0 });
      }
    }
  }
  if (missing.length === 0) return;

  // Real usage for the rows about to be created (approved → used, pending → pending).
  const neededTypeIds = [...new Set(missing.map((m) => m.leave_type_id))];
  const { data: reqs } = await supabase
    .from('leave_requests')
    .select('employee_id, leave_type_id, start_date, days, status')
    .in('leave_type_id', neededTypeIds)
    .in('status', ['Approved', 'Pending'])
    .gte('start_date', `${year}-01-01`)
    .lt('start_date', `${year + 1}-01-01`);

  const usage = new Map<string, { used: number; pending: number }>();
  for (const r of (reqs || []) as any[]) {
    const k = `${r.employee_id}|${r.leave_type_id}`;
    const u = usage.get(k) || { used: 0, pending: 0 };
    if (r.status === 'Approved') u.used += r.days || 0;
    else u.pending += r.days || 0;
    usage.set(k, u);
  }

  const rows = missing.map((m) => {
    const u = usage.get(`${m.employee_id}|${m.leave_type_id}`) || { used: 0, pending: 0 };
    return {
      employee_id: m.employee_id,
      leave_type_id: m.leave_type_id,
      year,
      total: m.total,
      used: u.used,
      remaining: Math.max(0, m.total - u.used),
      pending: u.pending,
    };
  });

  const { error } = await supabase.from('leave_balances').insert(rows);
  if (error) throw new Error(error.message);
}

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
    .select('*, leave_types(name), employees:employees!leave_requests_employee_id_fkey(first_name, last_name)')
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
  // Balances are always read for one year (default: current). Without this,
  // rows from past years merge into the totals and quota edits appear lost.
  const targetYear = year ?? new Date().getFullYear();
  // Best-effort: a new year starts with zero rows, which renders as empty /
  // stale-constant cards. Creating them on read keeps every consumer correct.
  try {
    await ensureYearBalances(supabase, targetYear);
  } catch (err) {
    console.error('ensureYearBalances failed:', err);
  }
  let query = supabase
    .from('leave_balances')
    .select('*, leave_types(name)')
    .eq('year', targetYear);

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
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

/**
 * Returns the employees.id linked to the current login, auto-creating a
 * minimal linked employee record on first use (via service role, so it works
 * regardless of employees-table RLS). This guarantees leave/attendance-style
 * writes always have a valid FK target satisfying the RLS ownership policy.
 */
export async function ensureLinkedEmployee(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  const { data: authData } = await supabase.auth.getUser();
  const authUser = authData.user;
  if (!authUser) throw new Error('Not authenticated. Please log in again.');
  const authUid = authUser.id;

  const { data: linked } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', authUid)
    .single();
  if (linked) return linked.id;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) {
    throw new Error(
      'No employee record is linked to this login and SUPABASE_SECRET_KEY is missing — add it to .env.local and restart, then retry.'
    );
  }
  const svc = createServiceClient<Database>(url, secret);

  const { data: profile } = await svc.from('users').select('name, email').eq('id', authUid).single();
  const email: string = profile?.email || authUser.email || '';
  const fullName: string = profile?.name || 'New Employee';
  if (!email) throw new Error('Cannot set up your employee record: login has no email.');
  const [first, ...rest] = fullName.split(' ');
  const joiningDate = new Date().toISOString().slice(0, 10);

  const tryInsert = async (code: string) =>
    svc
      .from('employees')
      .insert([{
        user_id: authUid,
        employee_code: code,
        first_name: first || fullName,
        last_name: rest.join(' ') || '',
        email,
        joining_date: joiningDate,
        status: 'Active',
      }])
      .select('id')
      .single();

  // employee_code / email are unique — retry once with a suffix on collision.
  let created = await tryInsert(`CQ-${authUid.slice(0, 8).toUpperCase()}`);
  if (created.error && /duplicate|unique|already exists/i.test(created.error.message)) {
    const existing = await svc.from('employees').select('id, user_id').eq('email', email).single();
    const existingRow = existing.data;
    if (existingRow && !existingRow.user_id) {
      // A seed/demo row with this email exists but is unclaimed — claim it.
      const { error: claimErr } = await svc
        .from('employees')
        .update({ user_id: authUid })
        .eq('id', existingRow.id);
      if (claimErr) throw new Error(`Could not link your employee record: ${claimErr.message}`);
      return existingRow.id as string;
    }
    created = await tryInsert(`CQ-${authUid.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`);
  }
  if (created.error || !created.data) {
    throw new Error(`Could not set up your employee record: ${created.error?.message || 'unknown error'}`);
  }
  return created.data.id;
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

  // The request form historically sent demo ids ("1", "5", …) which are not
  // valid UUIDs, and the RLS policy only accepts the employee record linked
  // to the login (employees.user_id = auth.uid()). Resolve to that record —
  // auto-creating it on first request so the table never stays empty.
  let employeeId = data.employeeId;
  if (!UUID_RE.test(employeeId || '')) {
    employeeId = await ensureLinkedEmployee(supabase);
  }

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
    employee_id: employeeId,
    leave_type_id: typeId!,
    start_date: data.startDate,
    end_date: data.endDate,
    days: data.days,
    reason: data.reason,
    status: 'Pending',
    applied_on: appliedOn,
  }]).select('*, employees:employees!leave_requests_employee_id_fkey(first_name, last_name)').single();

  if (reqErr) throw new Error(reqErr.message);

  if (typeId) {
    const currentYear = new Date(data.startDate).getFullYear();
    const { data: balData } = await supabase.from('leave_balances')
      .select('*')
      .eq('employee_id', employeeId)
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

  // approved_by is a UUID FK to employees — callers pass a display name, so
  // resolve to the approver's linked employee record (auto-created if needed).
  let approverId: string | null = null;
  if (approvedBy) {
    approverId = UUID_RE.test(approvedBy) ? approvedBy : await ensureLinkedEmployee(supabase);
  }

  const { error } = await supabase.from('leave_requests').update({
    status: status as any,
    approved_by: approverId,
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
  // Map camelCase form fields to DB columns; resolve type names to ids.
  let leaveTypeId = data.leaveTypeId;
  if (!leaveTypeId && data.leaveType) {
    const { data: lt } = await supabase.from('leave_types').select('id').eq('name', data.leaveType).single();
    if (lt) leaveTypeId = lt.id;
  }
  const patch: Database['public']['Tables']['leave_requests']['Update'] = {};
  if (leaveTypeId) patch.leave_type_id = leaveTypeId;
  if (data.startDate) patch.start_date = data.startDate;
  if (data.endDate) patch.end_date = data.endDate;
  if (data.days !== undefined) patch.days = data.days;
  if (data.reason !== undefined) patch.reason = data.reason;
  if (data.status) patch.status = data.status;
  const { error } = await supabase.from('leave_requests').update(patch).eq('id', id);
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

/**
 * Admin quota edit: sets the yearly total for EVERY employee's balance row
 * of one leave type (e.g. Annual Leave 20 → 24).
 *
 * The bound that matters is per-person usage: the new total must cover the
 * highest `used` value of any single employee — NOT the company-wide sum.
 * (Comparing against the summed aggregate is what wrongly blocked raising
 * 20 → 24 with "already used days (120)".) The type's `days_allowed` policy
 * is updated too so quota stays consistent for future balance rows.
 */
export async function setLeaveTypeBalanceTotal(leaveType: string, total: number): Promise<void> {
  if (!Number.isFinite(total) || total < 0) {
    throw new Error('Enter a valid number of days (0 or more).');
  }
  const supabase = await createClient();
  const currentYear = new Date().getFullYear();

  // Rows may not exist yet (e.g. quota edited before anyone's balances were
  // read this year) — create them first so the new total materializes.
  try {
    await ensureYearBalances(supabase, currentYear);
  } catch (err) {
    console.error('ensureYearBalances failed:', err);
  }

  const { data: typeRow, error: typeErr } = await supabase
    .from('leave_types')
    .select('id, name')
    .eq('name', leaveType)
    .single();
  if (typeErr || !typeRow) throw new Error(`Leave type "${leaveType}" was not found.`);

  const { data: rows, error: rowsErr } = await supabase
    .from('leave_balances')
    .select('id, used')
    .eq('leave_type_id', (typeRow as any).id)
    .eq('year', currentYear);
  if (rowsErr) throw new Error(rowsErr.message);

  const maxUsed = (rows || []).reduce((m: number, r: any) => Math.max(m, r.used || 0), 0);
  if (total < maxUsed) {
    throw new Error(
      `Total cannot be less than already used days (${maxUsed}) — at least one employee has used ${maxUsed} day${maxUsed === 1 ? '' : 's'}.`,
    );
  }

  if ((rows || []).length > 0) {
    for (const r of rows as any[]) {
      const used = r.used || 0;
      const { error: rowErr } = await supabase
        .from('leave_balances')
        .update({ total, remaining: total - used })
        .eq('id', r.id);
      if (rowErr) throw new Error(rowErr.message);
    }
  }

  const { error: typeUpdErr } = await supabase
    .from('leave_types')
    .update({ days_allowed: Math.floor(total) })
    .eq('id', (typeRow as any).id);
  if (typeUpdErr) throw new Error(typeUpdErr.message);

  revalidatePath('/leave');
  revalidatePath('/settings');
}
