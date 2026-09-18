'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { Job, Candidate } from '@/lib/types';

export async function getJobs(): Promise<Job[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('*, departments(name), branches(name)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map((db: any) => ({
    id: db.id,
    title: db.title,
    department: db.departments?.name || '',
    branch: db.branches?.name || '',
    vacancies: db.vacancies,
    applicants: db.applicants,
    status: db.status,
    postedDate: db.posted_date,
    closingDate: db.closing_date,
    description: db.description,
  }));
}

export async function getJob(id: string): Promise<Job> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('*, departments(name), branches(name)')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  const d = data as any;
  return {
    id: d.id,
    title: d.title,
    department: d.departments?.name || '',
    branch: d.branches?.name || '',
    vacancies: d.vacancies,
    applicants: d.applicants,
    status: d.status,
    postedDate: d.posted_date,
    closingDate: d.closing_date,
    description: d.description,
  };
}

export async function createJob(data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('jobs').insert([{
    title: data.title,
    department_id: data.departmentId,
    branch_id: data.branchId,
    vacancies: data.vacancies,
    status: data.status,
    posted_date: data.postedDate,
    closing_date: data.closingDate,
    description: data.description,
    applicants: 0
  }]);
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
}

export async function updateJob(id: string, data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('jobs').update({
    title: data.title,
    department_id: data.departmentId,
    branch_id: data.branchId,
    vacancies: data.vacancies,
    status: data.status,
    posted_date: data.postedDate,
    closing_date: data.closingDate,
    description: data.description,
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
}

export async function deleteJob(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
}

export async function getCandidates(jobId?: string): Promise<Candidate[]> {
  const supabase = await createClient();
  let query = supabase.from('candidates').select('*, jobs(title)').order('created_at', { ascending: false });
  if (jobId) {
    query = query.eq('job_id', jobId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map((db: any) => ({
    id: db.id,
    name: db.name,
    email: db.email,
    phone: db.phone,
    jobId: db.job_id,
    jobTitle: db.jobs?.title || '',
    stage: db.stage,
    appliedDate: db.applied_date,
    resume: db.resume,
    notes: db.notes,
    rating: db.rating,
  }));
}

export async function createCandidate(data: any) {
  const supabase = await createClient();
  const { error: candidateErr } = await supabase.from('candidates').insert([{
    name: data.name,
    email: data.email,
    phone: data.phone,
    job_id: data.jobId,
    stage: data.stage || 'Applied',
    applied_date: data.appliedDate || new Date().toISOString(),
    resume: data.resume,
    notes: data.notes,
    rating: data.rating,
  }]);
  if (candidateErr) throw new Error(candidateErr.message);

  // Increment applicants
  const { data: job } = await supabase.from('jobs').select('applicants').eq('id', data.jobId).single();
  if (job) {
    await supabase.from('jobs').update({ applicants: (job.applicants || 0) + 1 }).eq('id', data.jobId);
  }

  revalidatePath('/recruitment');
}

export async function updateCandidateStage(id: string, stage: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('candidates').update({ stage: stage as any }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
}

export async function updateCandidate(id: string, data: any) {
  const supabase = await createClient();
  const { error } = await supabase.from('candidates').update({
    name: data.name,
    email: data.email,
    phone: data.phone,
    job_id: data.jobId,
    stage: data.stage,
    applied_date: data.appliedDate,
    resume: data.resume,
    notes: data.notes,
    rating: data.rating,
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
}

export async function deleteCandidate(id: string) {
  const supabase = await createClient();
  
  // Decrement applicants
  const { data: candidate } = await supabase.from('candidates').select('job_id').eq('id', id).single();
  
  const { error } = await supabase.from('candidates').delete().eq('id', id);
  if (error) throw new Error(error.message);

  if (candidate) {
    const { data: job } = await supabase.from('jobs').select('applicants').eq('id', candidate.job_id).single();
    if (job) {
      await supabase.from('jobs').update({ applicants: Math.max(0, (job.applicants || 0) - 1) }).eq('id', candidate.job_id);
    }
  }

  revalidatePath('/recruitment');
}
