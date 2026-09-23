'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { PerformanceReview, Goal, Asset } from '@/lib/types';

export async function getPerformanceReviews(employeeId?: string): Promise<PerformanceReview[]> {
  const supabase = await createClient();
  let query = supabase.from('performance_reviews').select('*, employees(first_name, last_name)').order('created_at', { ascending: false });
  if (employeeId) query = query.eq('employee_id', employeeId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((db: any) => ({
    id: db.id,
    employeeId: db.employee_id,
    employeeName: db.employees ? `${db.employees.first_name} ${db.employees.last_name}` : '',
    cycleId: db.cycle_id,
    cycleName: db.cycle_name,
    selfRating: db.self_rating,
    managerRating: db.manager_rating,
    status: db.status,
    comments: db.comments,
  }));
}

export async function createPerformanceReview(data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('performance_reviews').insert([{
    employee_id: data.employeeId,
    cycle_id: data.cycleId,
    cycle_name: data.cycleName,
    self_rating: data.selfRating,
    manager_rating: data.managerRating,
    status: data.status,
    comments: data.comments,
  }]);
  if (error) throw new Error(error.message);
  revalidatePath('/performance');
}

export async function updatePerformanceReview(id: string, data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('performance_reviews').update({
    employee_id: data.employeeId,
    cycle_id: data.cycleId,
    cycle_name: data.cycleName,
    self_rating: data.selfRating,
    manager_rating: data.managerRating,
    status: data.status,
    comments: data.comments,
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/performance');
}

export async function getGoals(employeeId?: string): Promise<Goal[]> {
  const supabase = await createClient();
  let query = supabase.from('goals').select('*').order('due_date', { ascending: true });
  if (employeeId) query = query.eq('employee_id', employeeId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data || []).map((db: any) => ({
    id: db.id,
    employeeId: db.employee_id,
    title: db.title,
    description: db.description,
    progress: db.progress,
    status: db.status,
    dueDate: db.due_date,
  }));
}

export async function createGoal(data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('goals').insert([{
    employee_id: data.employeeId,
    title: data.title,
    description: data.description,
    progress: data.progress,
    status: data.status,
    due_date: data.dueDate,
  }]);
  if (error) throw new Error(error.message);
  revalidatePath('/performance');
}

export async function updateGoal(id: string, data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('goals').update({
    employee_id: data.employeeId,
    title: data.title,
    description: data.description,
    progress: data.progress,
    status: data.status,
    due_date: data.dueDate,
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/performance');
}

export async function deleteGoal(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/performance');
}

export async function getAssets(): Promise<Asset[]> {
  const supabase = await createClient();
  const { data: assets, error: assetErr } = await supabase.from('assets').select('*').order('created_at', { ascending: false });
  if (assetErr) {
    // Table was dropped by migration 003_drop_assets_ensure_recruitment.
    // Return empty instead of crashing callers (e.g. EmployeeDetail view).
    const msg = assetErr.message || '';
    if ((assetErr as any).code === 'PGRST205' || msg.includes('Could not find the table') || msg.includes('schema cache')) {
      return [];
    }
    throw new Error(assetErr.message);
  }

  const { data: assignments } = await supabase.from('asset_assignments').select('*, employees(first_name, last_name)').is('return_date', null);

  const assignmentMap = new Map((assignments || []).map((a: any) => [a.asset_id, a]));

  return (assets || []).map((db: any) => {
    const a = assignmentMap.get(db.id) as any;
    return {
      id: db.id,
      name: db.name,
      type: db.type,
      serialNumber: db.serial_number,
      assignedTo: a?.employee_id,
      assignedToName: a?.employees ? `${a.employees.first_name} ${a.employees.last_name}` : undefined,
      issueDate: a?.issue_date,
      returnDate: a?.return_date,
      condition: db.condition,
      status: db.status,
    };
  });
}

export async function createAsset(data: any) {
  const supabase = await createClient();
  const { data: asset, error } = await supabase.from('assets').insert([{
    name: data.name,
    type: data.type,
    serial_number: data.serialNumber,
    condition: data.condition || 'New',
    status: data.status || 'Available',
  }]).select().single();
  if (error) throw new Error(error.message);

  if (data.assignedTo && asset) {
    await supabase.from('asset_assignments').insert([{
      asset_id: asset.id,
      employee_id: data.assignedTo,
      issue_date: data.issueDate || new Date().toISOString().split('T')[0],
    }]);
  }

  revalidatePath('/performance');
}

export async function updateAsset(id: string, data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('assets').update({
    name: data.name,
    type: data.type,
    serial_number: data.serialNumber,
    condition: data.condition,
    status: data.status,
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/performance');
}

export async function assignAsset(assetId: string, employeeId: string, issueDate: string) {
  const supabase = await createClient();
  const { error: updateErr } = await supabase.from('assets').update({
    status: 'Assigned',
  }).eq('id', assetId);
  if (updateErr) throw new Error(updateErr.message);

  const { error: assignErr } = await supabase.from('asset_assignments').insert([{
    asset_id: assetId,
    employee_id: employeeId,
    issue_date: issueDate,
  }]);
  if (assignErr) throw new Error(assignErr.message);

  revalidatePath('/performance');
}

export async function returnAsset(assetId: string) {
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  await supabase.from('assets').update({
    status: 'Available',
  }).eq('id', assetId);

  await supabase.from('asset_assignments').update({
    return_date: today,
  }).eq('asset_id', assetId).is('return_date', null);

  revalidatePath('/performance');
}
