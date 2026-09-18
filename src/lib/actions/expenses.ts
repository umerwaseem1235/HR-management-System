'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import { ExpenseClaim } from '@/lib/types';

export async function getExpenseClaims(employeeId?: string): Promise<ExpenseClaim[]> {
  const supabase = await createClient();
  let query = supabase
    .from('expense_claims')
    .select(`
      *,
      employees:employee_id (
        first_name,
        last_name
      )
    `)
    .order('created_at', { ascending: false });

  if (employeeId) {
    query = query.eq('employee_id', employeeId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((row: any) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employees ? `${row.employees.first_name} ${row.employees.last_name}` : 'Unknown',
    category: row.category,
    amount: row.amount,
    date: row.date,
    description: row.description,
    status: row.status,
    receipt: row.receipt_url,
    submittedOn: row.submitted_on,
  }));
}

export async function createExpenseClaim(data: {
  employeeId: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  receipt?: string;
}): Promise<ExpenseClaim> {
  const supabase = await createClient();
  const submittedOn = new Date().toISOString().slice(0, 10);
  
  const { data: row, error } = await supabase
    .from('expense_claims')
    .insert({
      employee_id: data.employeeId,
      category: data.category,
      amount: data.amount,
      date: data.date,
      description: data.description,
      receipt_url: data.receipt,
      status: 'Pending',
      submitted_on: submittedOn
    })
    .select(`
      *,
      employees:employee_id (
        first_name,
        last_name
      )
    `)
    .single();

  if (error) throw new Error(error.message);

  revalidatePath('/expenses');

  const r = row as any;
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : 'Unknown',
    category: r.category,
    amount: r.amount,
    date: r.date,
    description: r.description,
    status: r.status,
    receipt: r.receipt_url,
    submittedOn: r.submitted_on,
  };
}

export async function updateExpenseStatus(id: string, status: 'Pending' | 'Approved' | 'Rejected' | 'Reimbursed') {
  const supabase = await createClient();
  const { error } = await supabase
    .from('expense_claims')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/expenses');
}

export async function updateExpenseClaim(id: string, data: {
  category: string;
  amount: number;
  date: string;
  description: string;
  receipt?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('expense_claims')
    .update({
      category: data.category,
      amount: data.amount,
      date: data.date,
      description: data.description,
      receipt_url: data.receipt,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/expenses');
}

export async function deleteExpenseClaim(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('expense_claims')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/expenses');
}
