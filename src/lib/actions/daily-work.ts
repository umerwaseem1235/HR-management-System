'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import { DailyWork, DailyWorkStatus } from '@/lib/types';

export async function getDailyWork(employeeId?: string): Promise<DailyWork[]> {
  const supabase = await createClient();
  let query = supabase
    .from('daily_work')
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
    title: row.title,
    description: row.description,
    date: row.date,
    fileData: row.file_url,
    fileName: row.file_name,
    link: row.link,
    status: row.status,
    submittedOn: row.submitted_on,
  }));
}

export async function createDailyWork(data: {
  employeeId: string;
  title: string;
  description: string;
  date: string;
  fileData?: string;
  fileName?: string;
  link?: string;
}): Promise<DailyWork> {
  const supabase = await createClient();
  const submittedOn = new Date().toISOString().slice(0, 10);
  
  const { data: row, error } = await supabase
    .from('daily_work')
    .insert({
      employee_id: data.employeeId,
      title: data.title,
      description: data.description,
      date: data.date,
      file_url: data.fileData,
      file_name: data.fileName,
      link: data.link,
      status: 'Submitted',
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
  revalidatePath('/work');

  const r = row as any;
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : 'Unknown',
    title: r.title,
    description: r.description,
    date: r.date,
    fileData: r.file_url,
    fileName: r.file_name,
    link: r.link,
    status: r.status,
    submittedOn: r.submitted_on,
  };
}

export async function updateDailyWork(id: string, data: {
  title: string;
  description: string;
  date: string;
  fileData?: string;
  fileName?: string;
  link?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('daily_work')
    .update({
      title: data.title,
      description: data.description,
      date: data.date,
      file_url: data.fileData,
      file_name: data.fileName,
      link: data.link,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/work');
}

export async function updateDailyWorkStatus(id: string, status: DailyWorkStatus) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('daily_work')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/work');
}

export async function deleteDailyWork(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('daily_work')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/work');
}
