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
/*  Interviews (union of both sides)                                   */
/* ------------------------------------------------------------------ */

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
    candidateName: db.candidates?.name || '',
    date: db.date,
    time: db.time || '10:00',
    mode: db.mode || 'In-person',
    // HEAD schema stores the name in `interviewer_name`, THEIRS in `interviewer`.
    interviewer: db.interviewer_name ?? db.interviewer ?? '',
    interviewerId: db.interviewer_id,
    round: db.round || 'Round 1',
    status: db.status || 'Scheduled',
    feedback: db.feedback || undefined,
    rating: db.rating ?? undefined,
  };
}

function isMissingColumn(error: any, ...cols: string[]): boolean {
  const msg = (error as any)?.message;
  return typeof msg === 'string' && cols.some((c) => msg.includes(c));
}
export async function getInterviews() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('interviews')
    .select('*, candidates(name)')
    .order('date', { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map(mapInterview);
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
  const base = {
    candidate_id: data.candidateId,
    date: data.date,
    time: data.time || '10:00',
    mode: data.mode,
    interviewer_id: toUuidOrNull(data.interviewerId),
    round: data.round || 'Round 1',
    status: 'Scheduled',
  };
  // HEAD schema names the column `interviewer_name`; fall back to `interviewer`
  // for schema variants created by the 004 migration.
  let { data: row, error } = await supabase
    .from('interviews')
    .insert([{ ...base, interviewer_name: data.interviewer }])
    .select('id')
    .single();
  if (error && isMissingColumn(error, 'interviewer_name')) {
    ({ data: row, error } = await supabase
      .from('interviews')
      .insert([{ ...base, interviewer: data.interviewer }])
      .select('id')
      .single());
  }
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
  return (row as any)?.id as string;
}

export async function createInterview(data: any) {
  const supabase = await createClient();
  const base = {
    candidate_id: data.candidateId,
    date: data.date,
    time: data.time || '10:00',
    mode: data.mode || 'In-person',
    interviewer_id: toUuidOrNull(data.interviewerId),
    round: data.round || 'Round 1',
    status: data.status || 'Scheduled',
  };
  // THEIRS schema names the column `interviewer`; fall back to `interviewer_name`
  // for schema variants created by the 005_ext migration.
  let { data: row, error } = await supabase
    .from('interviews')
    .insert([{ ...base, interviewer: data.interviewer || '' }])
    .select('*, candidates(name)')
    .single();
  if (error && isMissingColumn(error, 'interviewer') && !isMissingColumn(error, 'interviewer_name')) {
    ({ data: row, error } = await supabase
      .from('interviews')
      .insert([{ ...base, interviewer_name: data.interviewer || '' }])
      .select('*, candidates(name)')
      .single());
  }
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
  return mapInterview(row);
}

export async function updateInterview(
  id: string,
  data: {
    status?: string;
    feedback?: string;
    rating?: number;
    date?: string;
    time?: string;
    mode?: string;
    interviewer?: string;
    interviewerId?: string | null;
    round?: string;
  }
) {
  const supabase = await createClient();
  const patch: Record<string, any> = {};
  if (data.date !== undefined) patch.date = data.date;
  if (data.time !== undefined) patch.time = data.time;
  if (data.mode !== undefined) patch.mode = data.mode;
  if (data.interviewer !== undefined) {
    // Write both spellings; the retry below drops whichever the schema rejects.
    patch.interviewer = data.interviewer;
    patch.interviewer_name = data.interviewer;
  }
  if (data.interviewerId !== undefined) patch.interviewer_id = toUuidOrNull(data.interviewerId);
  if (data.round !== undefined) patch.round = data.round;
  if (data.status !== undefined) patch.status = data.status;
  if (data.feedback !== undefined) patch.feedback = data.feedback || null;
  if (data.rating !== undefined) patch.rating = data.rating;

  let { data: row, error } = await supabase
    .from('interviews')
    .update(patch as any)
    .eq('id', id)
    .select('*, candidates(name)')
    .single();

  if (error && isMissingColumn(error, 'interviewer', 'interviewer_name', 'feedback', 'rating')) {
    // Schema variant without these columns (e.g. after
    // 005_drop_interview_feedback_rating): strip the unknown keys and retry once.
    const msg: string = error.message;
    if (msg.includes('interviewer_name')) delete patch.interviewer_name;
    else if (msg.includes('interviewer')) delete patch.interviewer;
    if (msg.includes('feedback')) delete patch.feedback;
    if (msg.includes('rating')) delete patch.rating;
    ({ data: row, error } = await supabase
      .from('interviews')
      .update(patch as any)
      .eq('id', id)
      .select('*, candidates(name)')
      .single());
  }
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
  return mapInterview(row);
}

/* ------------------------------------------------------------------ */
/*  Offers (one row per candidate)                                     */
/* ------------------------------------------------------------------ */

function mapOffer(db: any) {
  return {
    id: db.id,
    candidateId: db.candidate_id,
    candidateName: db.candidates?.name || '',
    salary: Number(db.salary) || 0,
    joiningDate: db.joining_date || '',
    status: db.status || 'Sent',
    notes: db.notes || undefined,
  };
}

export async function getOffers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('offers')
    .select('*, candidates(name)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(mapOffer);
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

export async function upsertOffer(data: any) {
  const supabase = await createClient();
  const { data: row, error } = await supabase.from('offers').upsert([{
    candidate_id: data.candidateId,
    salary: data.salary || 0,
    joining_date: data.joiningDate || null,
    status: data.status || 'Sent',
    notes: data.notes || '',
  }], { onConflict: 'candidate_id' }).select('*, candidates(name)').single();
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
  return mapOffer(row);
}

export async function updateOfferStatus(idOrCandidateId: string, status: string) {
  // Union of both sides: HEAD callers pass the offer id, THEIRS pass the candidate id.
  const supabase = await createClient();
  let { data: row, error } = await supabase.from('offers')
    .update({ status })
    .eq('id', idOrCandidateId)
    .select('*, candidates(name)')
    .maybeSingle();
  if (!error && !row) {
    ({ data: row, error } = await supabase.from('offers')
      .update({ status })
      .eq('candidate_id', idOrCandidateId)
      .select('*, candidates(name)')
      .maybeSingle());
  }
  if (error) throw new Error(error.message);
  if (!row) throw new Error('Offer not found');
  revalidatePath('/recruitment');
  return mapOffer(row);
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
