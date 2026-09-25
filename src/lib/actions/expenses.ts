'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import { ExpenseClaim } from '@/lib/types';
import type { Database } from '@/lib/supabase/database.types';

type ExpenseClaimRow = Database['public']['Tables']['expense_claims']['Row'];
type AdminIdRow = Pick<Database['public']['Tables']['users']['Row'], 'id'>;

type ExpenseClaimRowWithEmployee = ExpenseClaimRow & {
  employees?: { first_name: string | null; last_name: string | null } | null;
};

function mapExpenseClaim(row: ExpenseClaimRowWithEmployee): ExpenseClaim {
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employees ? `${row.employees.first_name} ${row.employees.last_name}` : 'Unknown',
    category: row.category,
    amount: row.amount,
    date: row.date,
    description: row.description || '',
    status: row.status,
    receipt: row.receipt_url ?? undefined,
    submittedOn: row.submitted_on,
  };
}

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

  return ((data || []) as unknown as ExpenseClaimRowWithEmployee[]).map(mapExpenseClaim);
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

  return mapExpenseClaim(row as unknown as ExpenseClaimRowWithEmployee);
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

/* ------------------------------------------------------------------ */
/*  Approval workflow notifications                                    */
/* ------------------------------------------------------------------ */

async function loadClaimWithEmployee(supabase: Awaited<ReturnType<typeof createClient>>, claimId: string) {
  type ClaimRow = Pick<ExpenseClaimRow, 'id' | 'category' | 'amount' | 'date' | 'description' | 'status' | 'employee_id'>;
  type EmployeeRow = Pick<Database['public']['Tables']['employees']['Row'], 'id' | 'first_name' | 'last_name' | 'user_id'>;

  const { data, error } = await supabase
    .from('expense_claims')
    .select('id, category, amount, date, description, status, employee_id')
    .eq('id', claimId)
    .single();
  if (error || !data) throw new Error('Expense claim not found');

  const claim = data as ClaimRow;
  const { data: emp } = await supabase
    .from('employees')
    .select('id, first_name, last_name, user_id')
    .eq('id', claim.employee_id)
    .single();

  return { claim, employee: emp as EmployeeRow | null };
}

/**
 * Notify every Super Admin / HR Manager that a new claim needs review.
 * Returns the number of notifications created. Simply notifies whoever
 * exists — an empty admin roster yields 0 instead of an error.
 */
export async function notifyAdminsNewClaim(claimId: string): Promise<number> {
  const supabase = await createClient();
  const { claim, employee } = await loadClaimWithEmployee(supabase, claimId);

  const employeeName = employee
    ? `${employee.first_name} ${employee.last_name}`
    : 'An employee';

  const { data: admins, error: adminErr } = await supabase
    .from('users')
    .select('id')
    .in('role', ['super_admin', 'hr_manager']);
  if (adminErr) throw new Error(adminErr.message);
  if (!admins || admins.length === 0) return 0;

  const rows = (admins as AdminIdRow[]).map((a) => ({
    user_id: a.id,
    title: 'New Expense Claim',
    message: `${employeeName} submitted $${Number(claim.amount).toLocaleString()} for ${claim.category} (${claim.date}). Review pending.`,
    type: 'info',
    read: false,
    link: '/expenses',
  }));

  const { error } = await supabase.from('notifications').insert(rows);
  if (error) throw new Error(error.message);
  revalidatePath('/expenses');
  return rows.length;
}

/**
 * Notify the claimant about an approve/reject decision.
 * Silently skips when the employee record has no linked login account.
 */
export async function notifyClaimantDecision(
  claimId: string,
  decision: 'Approved' | 'Rejected',
  actorName: string,
): Promise<boolean> {
  const supabase = await createClient();
  const { claim, employee } = await loadClaimWithEmployee(supabase, claimId);

  const claimantUserId = employee?.user_id;
  if (!claimantUserId) return false;

  const approved = decision === 'Approved';
  const { error } = await supabase.from('notifications').insert({
    user_id: claimantUserId,
    title: approved ? 'Expense Claim Approved' : 'Expense Claim Rejected',
    message: approved
      ? `${actorName} approved your $${Number(claim.amount).toLocaleString()} claim for ${claim.category} (${claim.date}).`
      : `${actorName} rejected your $${Number(claim.amount).toLocaleString()} claim for ${claim.category} (${claim.date}). Contact HR for details.`,
    type: approved ? 'success' : 'error',
    read: false,
    link: '/expenses',
  });
  if (error) throw new Error(error.message);
  return true;
}
