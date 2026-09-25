'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { PerformanceReview, Goal } from '@/lib/types';
import type { Database } from '@/lib/supabase/database.types';

type PerformanceReviewRow = Database['public']['Tables']['performance_reviews']['Row'];
type PerformanceReviewStatus = PerformanceReviewRow['status'];
type GoalRow = Database['public']['Tables']['goals']['Row'];
type GoalStatus = GoalRow['status'];

type PerformanceReviewRowWithEmployee = PerformanceReviewRow & {
  employees?: { first_name: string | null; last_name: string | null } | null;
};

interface PerformanceReviewInput {
  employeeId: string;
  cycleId: string;
  cycleName?: string | null;
  selfRating?: number | null;
  managerRating?: number | null;
  status?: PerformanceReviewStatus;
  comments?: string | null;
}

interface GoalInput {
  employeeId: string;
  title: string;
  description?: string | null;
  progress?: number | null;
  status?: GoalStatus;
  dueDate?: string | null;
}

export async function getPerformanceReviews(employeeId?: string): Promise<PerformanceReview[]> {
  const supabase = await createClient();
  let query = supabase.from('performance_reviews').select('*, employees(first_name, last_name)').order('created_at', { ascending: false });
  if (employeeId) query = query.eq('employee_id', employeeId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data || []) as unknown as PerformanceReviewRowWithEmployee[]).map((db) => ({
    id: db.id,
    employeeId: db.employee_id,
    employeeName: db.employees ? `${db.employees.first_name} ${db.employees.last_name}` : '',
    cycleId: db.cycle_id,
    cycleName: db.cycle_name || '',
    selfRating: db.self_rating ?? undefined,
    managerRating: db.manager_rating ?? undefined,
    status: db.status,
    comments: db.comments ?? undefined,
  }));
}

export async function createPerformanceReview(data: PerformanceReviewInput) {
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

export async function updatePerformanceReview(id: string, data: PerformanceReviewInput) {
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

  return (data || []).map((db) => ({
    id: db.id,
    employeeId: db.employee_id,
    title: db.title,
    description: db.description || '',
    progress: db.progress ?? 0,
    status: db.status,
    dueDate: db.due_date || '',
  }));
}

export async function createGoal(data: GoalInput) {
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

export async function updateGoal(id: string, data: GoalInput) {
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

// NOTE: The legacy asset-management actions (getAssets, createAsset,
// updateAsset, assignAsset, returnAsset) were removed — migration
// 003_drop_assets_ensure_recruitment permanently dropped the `assets`
// and `asset_assignments` tables, so those queries could never succeed.
