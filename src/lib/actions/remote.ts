'use server';

import { createClient } from '@/lib/server';
import { ensureLinkedEmployee } from '@/lib/actions/leave';
import { revalidatePath } from 'next/cache';
import { RemoteRequest, RemoteRequestStatus } from '@/lib/types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getRemoteRequests(employeeId?: string): Promise<RemoteRequest[]> {
  const supabase = await createClient();
  let query = supabase
    .from('remote_requests')
    .select(`
      *,
      employees:employee_id (
        first_name,
        last_name
      ),
      reviewer:reviewed_by (
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
    fromDate: row.from_date,
    toDate: row.to_date,
    days: row.days,
    reason: row.reason,
    workPlan: row.work_plan,
    status: row.status,
    requestedOn: row.requested_on,
    reviewedBy: row.reviewer ? `${row.reviewer.first_name} ${row.reviewer.last_name}` : row.reviewed_by,
    reviewComments: row.review_comments,
  }));
}

export async function createRemoteRequest(data: {
  employeeId: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  workPlan?: string;
}): Promise<RemoteRequest> {
  const supabase = await createClient();
  const requestedOn = new Date().toISOString().slice(0, 10);

  // employee_id is a UUID FK and RLS only accepts the record linked to the
  // login — resolve demo ids to the linked record (auto-created if needed).
  let employeeId = data.employeeId;
  if (!UUID_RE.test(employeeId || '')) {
    employeeId = await ensureLinkedEmployee(supabase);
  }

  const { data: row, error } = await supabase
    .from('remote_requests')
    .insert({
      employee_id: employeeId,
      from_date: data.fromDate,
      to_date: data.toDate,
      days: data.days,
      reason: data.reason,
      work_plan: data.workPlan,
      status: 'Pending',
      requested_on: requestedOn
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
  revalidatePath('/remote');

  const r = row as any;
  return {
    id: r.id,
    employeeId: r.employee_id,
    employeeName: r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : 'Unknown',
    fromDate: r.from_date,
    toDate: r.to_date,
    days: r.days,
    reason: r.reason,
    workPlan: r.work_plan,
    status: r.status,
    requestedOn: r.requested_on,
  };
}

export async function updateRemoteStatus(id: string, status: RemoteRequestStatus, reviewedBy?: string, reviewComments?: string) {
  const supabase = await createClient();
  // reviewed_by is a UUID FK to employees — callers pass a display name, so
  // resolve to the reviewer's linked employee record (auto-created if needed).
  let reviewerId: string | null = null;
  if (reviewedBy) {
    reviewerId = UUID_RE.test(reviewedBy) ? reviewedBy : await ensureLinkedEmployee(supabase);
  }
  const { error } = await supabase
    .from('remote_requests')
    .update({
      status,
      reviewed_by: reviewerId,
      review_comments: reviewComments,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/remote');
}

export async function deleteRemoteRequest(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('remote_requests')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/remote');
}
