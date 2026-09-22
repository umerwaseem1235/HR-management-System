'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { PayrollRun, PayrollLineItem, SalaryComponent, PayrollRunStatus } from '@/lib/payroll';
import type { Payslip, UserRole } from '@/lib/types';

/**
 * Resolve the caller's role from the session (single source of truth).
 * Throws when unauthenticated or when the profile cannot be resolved.
 */
async function getCallerRole(): Promise<UserRole> {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error('You must be signed in to manage payroll.');
  }
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', authData.user.id)
    .single();
  if (profileError || !profile?.role) {
    throw new Error('Unable to verify your permissions. Please sign in again.');
  }
  return profile.role as UserRole;
}

async function requirePayrollRole(allowed: UserRole[], action: string) {
  const role = await getCallerRole();
  if (!allowed.includes(role)) {
    throw new Error(
      role === 'hr_manager'
        ? `Only a Super Admin can ${action}. Please ask a Super Admin to proceed.`
        : `You do not have permission to ${action}.`,
    );
  }
  return role;
}

export async function getPayrollRuns(): Promise<PayrollRun[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('payroll_runs')
    .select('*')
    .order('year', { ascending: false })
    .order('month_index', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((db: any) => ({
    id: db.id,
    month: db.month,
    monthIndex: db.month_index,
    year: db.year,
    status: (db.status || 'Draft') as PayrollRunStatus,
    totalGross: db.total_gross || 0,
    totalDeductions: db.total_deductions || 0,
    totalNet: db.total_net || 0,
    createdOn: db.created_on,
    finalizedOn: db.finalized_on || undefined,
    finalizedBy: db.finalized_by || undefined,
    items: [],
  }));
}

export async function getPayrollRun(id: string): Promise<PayrollRun> {
  const supabase = await createClient();
  const { data: runData, error: runError } = await supabase
    .from('payroll_runs')
    .select('*')
    .eq('id', id)
    .single();

  if (runError) throw new Error(runError.message);

  const { data: itemsData, error: itemsError } = await supabase
    .from('payroll_items')
    .select('*')
    .eq('payroll_run_id', id);

  if (itemsError) throw new Error(itemsError.message);

  const items: PayrollLineItem[] = (itemsData || []).map((db: any) => ({
    id: db.id,
    employeeId: db.employee_id,
    employeeName: db.employee_name,
    department: db.department,
    basicSalary: db.basic_salary,
    allowances: db.allowances,
    deductions: db.deductions,
    paidLeaveDays: db.paid_leave_days,
    unpaidLeaveDays: db.unpaid_leave_days,
    absentDays: db.absent_days,
    leaveDeduction: db.leave_deduction,
    grossSalary: db.gross_salary,
    totalAllowances: db.total_allowances,
    totalDeductions: db.total_deductions,
    netSalary: db.net_salary,
  }));

  return {
    id: runData.id,
    month: runData.month,
    monthIndex: runData.month_index,
    year: runData.year,
    status: (runData.status || 'Draft') as PayrollRunStatus,
    totalGross: runData.total_gross || 0,
    totalDeductions: runData.total_deductions || 0,
    totalNet: runData.total_net || 0,
    createdOn: runData.created_on,
    finalizedOn: runData.finalized_on || undefined,
    finalizedBy: runData.finalized_by || undefined,
    items,
  };
}

export async function createPayrollRun(monthIndex: number, year: number, items: PayrollLineItem[]) {
  const supabase = await createClient();
  const id = `PR-${year}-${String(monthIndex + 1).padStart(2, '0')}`;
  
  const totalGross = items.reduce((s, i) => s + i.grossSalary, 0);
  const totalDeductions = items.reduce((s, i) => s + i.totalDeductions, 0);
  const totalNet = items.reduce((s, i) => s + i.netSalary, 0);

  const { error: runErr } = await supabase.from('payroll_runs').insert([{
    id,
    month: new Date(year, monthIndex).toLocaleString('en-US', { month: 'long' }),
    month_index: monthIndex,
    year,
    status: 'Draft',
    total_gross: totalGross,
    total_deductions: totalDeductions,
    total_net: totalNet,
    created_on: new Date().toISOString()
  }]);

  if (runErr) throw new Error(runErr.message);

  const itemsToInsert = items.map(i => ({
    payroll_run_id: id,
    employee_id: i.employeeId,
    employee_name: i.employeeName,
    department: i.department,
    basic_salary: i.basicSalary,
    allowances: i.allowances,
    deductions: i.deductions,
    paid_leave_days: i.paidLeaveDays,
    unpaid_leave_days: i.unpaidLeaveDays,
    absent_days: i.absentDays,
    leave_deduction: i.leaveDeduction,
    gross_salary: i.grossSalary,
    total_allowances: i.totalAllowances,
    total_deductions: i.totalDeductions,
    net_salary: i.netSalary,
  }));

  const { error: itemsErr } = await supabase.from('payroll_items').insert(itemsToInsert);
  if (itemsErr) throw new Error(itemsErr.message);

  revalidatePath('/payroll');
}

export async function updatePayrollRunStatus(id: string, status: string, finalizedBy?: string) {
  const supabase = await createClient();

  // Guard transitions off a locked run: only a Super Admin may move a
  // Finalized run back to Draft/Reviewed (unlock). Finalizing itself is
  // allowed for Super Admins and HR Managers.
  const { data: current } = await supabase.from('payroll_runs').select('status').eq('id', id).single();
  if (current?.status === 'Finalized' && status !== 'Finalized') {
    await requirePayrollRole(['super_admin'], 'unlock this finalized payroll run');
  } else if (status === 'Finalized') {
    await requirePayrollRole(['super_admin', 'hr_manager'], 'finalize payroll');
  }

  const updateData: any = { status };
  if (status === 'Finalized') {
    updateData.finalized_on = new Date().toISOString();
    updateData.finalized_by = finalizedBy;
  }
  if (current?.status === 'Finalized' && status !== 'Finalized') {
    // Unlocking clears the lock metadata so the audit trail stays honest.
    updateData.finalized_on = null;
    updateData.finalized_by = null;
  }

  const { error } = await supabase.from('payroll_runs').update(updateData).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/payroll');
}

export async function updatePayrollItem(id: string, data: any) {
  const supabase = await createClient();
  // Never mutate lines belonging to a locked run — unlock first (Super Admin only).
  const { data: line } = await supabase.from('payroll_items').select('payroll_run_id').eq('id', id).single();
  if (line?.payroll_run_id) {
    const { data: parent } = await supabase
      .from('payroll_runs')
      .select('status')
      .eq('id', line.payroll_run_id)
      .single();
    if (parent?.status === 'Finalized') {
      throw new Error('This payroll run is finalized and locked. Only a Super Admin can unlock it before editing.');
    }
  }
  const { error } = await supabase.from('payroll_items').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  // Optional: could recalculate run totals here if needed
  revalidatePath('/payroll');
}

export async function finalizePayrollRun(id: string, finalizedBy?: string) {
  // Single authorization check + single client for the whole transition.
  // (Delegating to updatePayrollRunStatus here would re-authenticate and
  // re-read the run a second time for no benefit.)
  await requirePayrollRole(['super_admin', 'hr_manager'], 'finalize payroll');
  const supabase = await createClient();
  const run = await getPayrollRun(id);

  // State-machine guard: only a Reviewed run can be locked.
  // Re-finalizing after a Super Admin unlock is allowed — generated slips
  // are upserted (same deterministic ids), never duplicated.
  if (run.status === 'Finalized') {
    throw new Error('This payroll run is already finalized and locked.');
  }
  if (run.status !== 'Reviewed') {
    throw new Error(`Only a Reviewed run can be finalized (current status: ${run.status}). Mark it as Reviewed first.`);
  }

  const { error: lockErr } = await supabase
    .from('payroll_runs')
    .update({
      status: 'Finalized',
      finalized_on: new Date().toISOString(),
      finalized_by: finalizedBy || 'System',
    })
    .eq('id', id);
  if (lockErr) throw new Error(lockErr.message);

  const generatedOn = new Date().toISOString();
  const payslips = run.items.map((item, idx) => ({
    id: `gen-${run.id}-${idx + 1}`,
    employee_id: item.employeeId,
    employee_name: item.employeeName,
    month: run.month,
    year: run.year,
    basic_salary: item.basicSalary,
    allowances: item.allowances,
    deductions: item.deductions,
    gross_salary: item.grossSalary,
    net_salary: item.netSalary,
    status: 'Finalized' as const,
    generated_on: generatedOn
  }));

  // Upsert (not insert): payslip ids are deterministic per run, so a
  // re-finalize after unlock — or after delete + recreate of the same
  // month — refreshes the slips instead of failing with a duplicate key.
  const { error } = await supabase.from('payslips').upsert(payslips);
  if (error) throw new Error(error.message);

  revalidatePath('/payroll');
}

/**
 * Unlock a finalized payroll run (Super Admin only).
 * Returns the run to Reviewed so it can be corrected and re-finalized.
 * Finalize remains open to Super Admins and HR Managers.
 */
export async function unlockPayrollRun(id: string) {
  await requirePayrollRole(['super_admin'], 'unlock this finalized payroll run');
  const supabase = await createClient();
  const run = await getPayrollRun(id);

  if (run.status !== 'Finalized') {
    throw new Error(`Only a Finalized run can be unlocked (current status: ${run.status}).`);
  }

  const { error } = await supabase
    .from('payroll_runs')
    .update({ status: 'Reviewed', finalized_on: null, finalized_by: null })
    .eq('id', id);
  if (error) throw new Error(error.message);

  revalidatePath('/payroll');
}

export async function getPayslips(employeeId?: string): Promise<Payslip[]> {
  const supabase = await createClient();
  let query = supabase.from('payslips').select('*').order('generated_on', { ascending: false });
  if (employeeId) query = query.eq('employee_id', employeeId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((db: any) => ({
    id: db.id,
    employeeId: db.employee_id,
    employeeName: db.employee_name,
    month: db.month,
    year: db.year,
    basicSalary: db.basic_salary,
    allowances: db.allowances,
    deductions: db.deductions,
    grossSalary: db.gross_salary,
    netSalary: db.net_salary,
    status: db.status,
    generatedOn: db.generated_on,
  }));
}

export async function getSalaryComponents(): Promise<SalaryComponent[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('salary_components').select('*');
  if (error) throw new Error(error.message);
  return (data || []).map((db: any) => ({
    id: db.id,
    name: db.name,
    amount: db.amount,
    kind: db.kind,
  }));
}

export async function createSalaryComponent(data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('salary_components').insert([data]);
  if (error) throw new Error(error.message);
  revalidatePath('/payroll');
}

export async function updateSalaryComponent(id: string, data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('salary_components').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/payroll');
}

export async function deleteSalaryComponent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('salary_components').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/payroll');
}

export async function deletePayrollRun(id: string) {
  await requirePayrollRole(['super_admin', 'hr_manager'], 'delete payroll runs');
  const supabase = await createClient();
  // Locked runs are never deletable — unlock first (Super Admin only).
  const { data: current } = await supabase.from('payroll_runs').select('status').eq('id', id).single();
  if (current?.status === 'Finalized') {
    throw new Error('This payroll run is finalized and locked. Only a Super Admin can unlock it before deletion.');
  }
  // Items first (FK), then the run. Generated payslips are kept as history.
  const { error: itemsErr } = await supabase.from('payroll_items').delete().eq('payroll_run_id', id);
  if (itemsErr) throw new Error(itemsErr.message);
  const { error: runErr } = await supabase.from('payroll_runs').delete().eq('id', id);
  if (runErr) throw new Error(runErr.message);
  revalidatePath('/payroll');
}

export async function updatePayrollRunTotals(id: string, totals: { totalGross: number; totalDeductions: number; totalNet: number }) {
  const supabase = await createClient();
  const { error } = await supabase.from('payroll_runs').update({
    total_gross: totals.totalGross,
    total_deductions: totals.totalDeductions,
    total_net: totals.totalNet,
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/payroll');
}
