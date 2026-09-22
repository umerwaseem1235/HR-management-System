'use server';

import { createClient } from '@/lib/server';
import { ensureLinkedEmployee } from '@/lib/actions/leave';
import { revalidatePath } from 'next/cache';
import { ProgressEntry } from '@/lib/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getProgressEntries(employeeId?: string): Promise<ProgressEntry[]> {
  const supabase = await createClient();
  let query = supabase
    .from('progress_entries')
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
    projectName: row.project_name,
    description: row.description,
    submissionDate: row.submission_date,
    employeeId: row.employee_id,
    employeeName: row.employees ? `${row.employees.first_name} ${row.employees.last_name}` : 'Unknown',
    createdOn: row.created_on,
  }));
}

export async function createProgressEntry(data: {
  employeeId: string;
  projectName: string;
  description: string;
  submissionDate: string;
}): Promise<ProgressEntry> {
  const supabase = await createClient();
  const createdOn = new Date().toISOString().slice(0, 10);

  // employee_id is a UUID FK and RLS only accepts the record linked to the
  // login — resolve demo ids to the linked record (auto-created if needed).
  let employeeId = data.employeeId;
  if (!UUID_RE.test(employeeId || '')) {
    employeeId = await ensureLinkedEmployee(supabase);
  }

  const { data: row, error } = await supabase
    .from('progress_entries')
    .insert({
      employee_id: employeeId,
      project_name: data.projectName,
      description: data.description,
      submission_date: data.submissionDate,
      created_on: createdOn
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
  revalidatePath('/progress');

  const r = row as any;
  return {
    id: r.id,
    projectName: r.project_name,
    description: r.description,
    submissionDate: r.submission_date,
    employeeId: r.employee_id,
    employeeName: r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : 'Unknown',
    createdOn: r.created_on,
  };
}

export async function updateProgressEntry(id: string, data: {
  projectName: string;
  description: string;
  submissionDate: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('progress_entries')
    .update({
      project_name: data.projectName,
      description: data.description,
      submission_date: data.submissionDate,
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/progress');
}

export async function deleteProgressEntry(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('progress_entries')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/progress');
}
