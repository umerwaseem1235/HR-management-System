'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { Job, Candidate } from '@/lib/types';

function mapJob(db: any): Job {
  return {
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
  };
}

export async function getJobs(): Promise<Job[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('*, departments(name), branches(name)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapJob);
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

export async function createJob(data: any): Promise<Job> {
  const supabase = await createClient();
  const { data: row, error } = await supabase.from('jobs').insert([{
    title: data.title,
    department_id: data.departmentId,
    branch_id: data.branchId,
    vacancies: data.vacancies,
    status: data.status,
    posted_date: data.postedDate,
    closing_date: data.closingDate,
    description: data.description,
    applicants: 0
  }]).select('*, departments(name), branches(name)').single();
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
  return mapJob(row);
}

export async function updateJob(id: string, data: any): Promise<Job> {
  const supabase = await createClient();
  const { data: row, error } = await supabase.from('jobs').update({
    title: data.title,
    department_id: data.departmentId,
    branch_id: data.branchId,
    vacancies: data.vacancies,
    status: data.status,
    posted_date: data.postedDate,
    closing_date: data.closingDate,
    description: data.description,
  }).eq('id', id).select('*, departments(name), branches(name)').single();
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
  return mapJob(row);
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
    source: db.source || 'Other',
  }));
}

export async function createCandidate(data: any) {
  const supabase = await createClient();
  const { data: row, error: candidateErr } = await supabase.from('candidates').insert([{
    name: data.name,
    email: data.email,
    phone: data.phone,
    job_id: data.jobId,
    stage: data.stage || 'Applied',
    applied_date: data.appliedDate || new Date().toISOString().slice(0, 10),
    resume: data.resume,
    notes: data.notes,
    rating: data.rating,
    source: data.source || 'Other',
  }]).select('*, jobs(title)').single();
  if (candidateErr) throw new Error(candidateErr.message);

  // Increment applicants
  const { data: job } = await supabase.from('jobs').select('applicants').eq('id', data.jobId).single();
  if (job) {
    await supabase.from('jobs').update({ applicants: (job.applicants || 0) + 1 }).eq('id', data.jobId);
  }

  revalidatePath('/recruitment');
  const r = row as any;
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    jobId: r.job_id,
    jobTitle: r.jobs?.title || data.jobTitle || '',
    stage: r.stage,
    appliedDate: r.applied_date,
    resume: r.resume,
    notes: r.notes,
    rating: r.rating,
    source: r.source || 'Other',
  };
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
    source: data.source,
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

// =====================================================
// INTERVIEWS (Reminders tab)
// =====================================================

// The interviewer dropdown still uses demo employee ids like "1", which are
// not valid UUIDs. The name is always stored as text; the id link is only
// stored when it is a real UUID so the insert never fails on uuid syntax.
function toUuidOrNull(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function mapInterview(db: any) {
  return {
    id: db.id,
    candidateId: db.candidate_id,
    date: db.date,
    time: db.time || '10:00',
    mode: db.mode || 'In-person',
    interviewer: db.interviewer || '',
    interviewerId: db.interviewer_id,
    round: db.round || 'Round 1',
    status: db.status || 'Scheduled',
  };
}

export async function getInterviews() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .order('date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(mapInterview);
}

export async function createInterview(data: any) {
  const supabase = await createClient();
  const { data: row, error } = await supabase.from('interviews').insert([{
    candidate_id: data.candidateId,
    date: data.date,
    time: data.time || '10:00',
    mode: data.mode || 'In-person',
    interviewer: data.interviewer || '',
    interviewer_id: toUuidOrNull(data.interviewerId),
    round: data.round || 'Round 1',
    status: 'Scheduled',
  }]).select('*').single();
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
  return mapInterview(row);
}

export async function updateInterview(id: string, data: any) {
  const supabase = await createClient();
  const { data: row, error } = await supabase.from('interviews').update({
    date: data.date,
    time: data.time,
    mode: data.mode,
    interviewer: data.interviewer,
    interviewer_id: data.interviewerId === undefined ? undefined : toUuidOrNull(data.interviewerId),
    round: data.round,
    status: data.status,
  }).eq('id', id).select('*').single();
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
  return mapInterview(row);
}

// =====================================================
// OFFERS (Offers Noted tab — one row per candidate)
// =====================================================

function mapOffer(db: any) {
  return {
    id: db.id,
    candidateId: db.candidate_id,
    salary: Number(db.salary) || 0,
    joiningDate: db.joining_date || '',
    status: db.status || 'Sent',
    notes: db.notes || '',
  };
}

export async function getOffers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapOffer);
}

export async function upsertOffer(data: any) {
  const supabase = await createClient();
  const { data: row, error } = await supabase.from('offers').upsert([{
    candidate_id: data.candidateId,
    salary: data.salary || 0,
    joining_date: data.joiningDate || null,
    status: data.status || 'Sent',
    notes: data.notes || '',
  }], { onConflict: 'candidate_id' }).select('*').single();
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
  return mapOffer(row);
}

export async function updateOfferStatus(candidateId: string, status: string) {
  const supabase = await createClient();
  const { data: row, error } = await supabase.from('offers')
    .update({ status })
    .eq('candidate_id', candidateId)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
  return mapOffer(row);
}
