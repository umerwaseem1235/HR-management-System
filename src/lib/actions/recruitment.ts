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
    source: db.source || 'Other',
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
    source: data.source || 'Other',
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
    ...(data.source ? { source: data.source } : {}),
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

/* ------------------------------------------------------------------ */
/*  Candidate source / history                                         */
/* ------------------------------------------------------------------ */

export async function updateCandidateSource(id: string, source: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('candidates').update({ source }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
}

export async function getCandidateHistory(candidateId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('candidate_history')
    .select('*')
    .eq('candidate_id', candidateId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => ({
    date: row.date,
    action: row.action,
    note: row.note || undefined,
  }));
}

export async function addCandidateHistory(candidateId: string, action: string, note?: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('candidate_history').insert([{
    candidate_id: candidateId,
    date: new Date().toISOString().slice(0, 10),
    action,
    note: note || null,
  }]);
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
}

/* ------------------------------------------------------------------ */
/*  Interviews                                                         */
/* ------------------------------------------------------------------ */

export async function getInterviews() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('interviews')
    .select('*, candidates(name)')
    .order('date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => ({
    id: row.id,
    candidateId: row.candidate_id,
    candidateName: row.candidates?.name || '',
    date: row.date,
    time: row.time,
    mode: row.mode,
    interviewer: row.interviewer_name,
    interviewerId: row.interviewer_id || undefined,
    round: row.round,
    status: row.status,
    feedback: row.feedback || undefined,
    rating: row.rating ?? undefined,
  }));
}

export async function scheduleInterview(data: {
  candidateId: string;
  date: string;
  time: string;
  mode: string;
  interviewer: string;
  interviewerId?: string;
  round: string;
}) {
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from('interviews')
    .insert([{
      candidate_id: data.candidateId,
      date: data.date,
      time: data.time || '10:00',
      mode: data.mode,
      interviewer_name: data.interviewer,
      interviewer_id: data.interviewerId || null,
      round: data.round || 'Round 1',
      status: 'Scheduled',
    }])
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
  return row.id as string;
}

export async function updateInterview(id: string, data: { status?: string; feedback?: string; rating?: number }) {
  const supabase = await createClient();
  const { error } = await supabase.from('interviews').update({
    ...(data.status ? { status: data.status } : {}),
    ...(data.feedback !== undefined ? { feedback: data.feedback || null } : {}),
    ...(data.rating !== undefined ? { rating: data.rating } : {}),
  }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
}

/* ------------------------------------------------------------------ */
/*  Offers                                                             */
/* ------------------------------------------------------------------ */

export async function getOffers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('offers')
    .select('*, candidates(name)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((row: any) => ({
    id: row.id,
    candidateId: row.candidate_id,
    candidateName: row.candidates?.name || '',
    salary: Number(row.salary) || 0,
    joiningDate: row.joining_date || '',
    status: row.status,
    notes: row.notes || undefined,
  }));
}

export async function saveOffer(data: { candidateId: string; salary: number; joiningDate: string; notes?: string }) {
  const supabase = await createClient();
  const { error } = await supabase.from('offers').upsert([{
    candidate_id: data.candidateId,
    salary: data.salary,
    joining_date: data.joiningDate || null,
    status: 'Sent',
    notes: data.notes || null,
  }], { onConflict: 'candidate_id' });
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
}

export async function updateOfferStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('offers').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
}

/* ------------------------------------------------------------------ */
/*  Convert hired candidate to employee                                */
/* ------------------------------------------------------------------ */

export async function convertCandidateToEmployee(data: {
  candidateId: string;
  employeeCode?: string;
  department: string;
  designation: string;
  branch: string;
  joiningDate: string;
  salary: number;
}) {
  const supabase = await createClient();

  const { data: cand, error: candErr } = await supabase
    .from('candidates')
    .select('*')
    .eq('id', data.candidateId)
    .single();
  if (candErr || !cand) throw new Error('Candidate not found');
  const c = cand as any;

  async function resolveId(table: 'departments' | 'designations' | 'branches', name: string): Promise<string | null> {
    if (!name) return null;
    const { data } = await supabase.from(table).select('id').ilike('name', name).limit(1).single();
    return (data as any)?.id || null;
  }

  const [first, ...rest] = (c.name || '').split(' ');
  const { data: emp, error: empErr } = await supabase
    .from('employees')
    .insert([{
      employee_code: data.employeeCode || `CQ-${Date.now().toString().slice(-6)}`,
      first_name: first || c.name,
      last_name: rest.join(' ') || '',
      email: c.email,
      phone: c.phone,
      department_id: await resolveId('departments', data.department),
      designation_id: await resolveId('designations', data.designation),
      branch_id: await resolveId('branches', data.branch),
      employment_type: 'Full-time',
      joining_date: data.joiningDate,
      status: 'Probation',
      salary: data.salary || null,
    }])
    .select('id')
    .single();
  if (empErr) throw new Error(empErr.message);

  await supabase.from('candidates').update({ stage: 'Hired' }).eq('id', data.candidateId);
  await addCandidateHistory(data.candidateId, 'Hired', `Converted to employee ${(emp as any).id}`);

  revalidatePath('/recruitment');
  revalidatePath('/employees');
  return (emp as any).id as string;
}
