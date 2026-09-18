'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { PayrollRun, PayrollLineItem, SalaryComponent, PayrollRunStatus } from '@/lib/payroll';
import type { Payslip } from '@/lib/types';

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
  const updateData: any = { status };
  if (status === 'Finalized') {
    updateData.finalized_on = new Date().toISOString();
    updateData.finalized_by = finalizedBy;
  }

  const { error } = await supabase.from('payroll_runs').update(updateData).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/payroll');
}

export async function updatePayrollItem(id: string, data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('payroll_items').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  // Optional: could recalculate run totals here if needed
  revalidatePath('/payroll');
}

export async function finalizePayrollRun(id: string) {
  const supabase = await createClient();
  const run = await getPayrollRun(id);
  
  await updatePayrollRunStatus(id, 'Finalized', 'System'); // Or pass user

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

  const { error } = await supabase.from('payslips').insert(payslips);
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
