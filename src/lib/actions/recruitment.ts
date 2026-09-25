'use server';

import { createClient } from '@/lib/server';
import { revalidatePath } from 'next/cache';
import type { Job, Candidate } from '@/lib/types';
import type { Database } from '@/lib/supabase/database.types';
import type { PostgrestError } from '@supabase/supabase-js';

type JobRow = Database['public']['Tables']['jobs']['Row'];
type CandidateRow = Database['public']['Tables']['candidates']['Row'];
type InterviewRow = Database['public']['Tables']['interviews']['Row'];
type OfferRow = Database['public']['Tables']['offers']['Row'];
type CandidateHistoryRow = Database['public']['Tables']['candidate_history']['Row'];
type InterviewUpdate = Database['public']['Tables']['interviews']['Update'];
type CandidateStage = Database['public']['Tables']['candidates']['Row']['stage'];
type InterviewStatus = 'Scheduled' | 'Completed' | 'Cancelled';

interface NameRef {
  name: string | null;
}

interface JobRowWithJoins extends JobRow {
  departments?: NameRef | null;
  branches?: NameRef | null;
}

interface CandidateRowWithJob extends CandidateRow {
  jobs?: { title: string | null } | null;
}

interface InterviewRowWithCandidate extends InterviewRow {
  candidates?: NameRef | null;
}

interface OfferRowWithCandidate extends OfferRow {
  candidates?: NameRef | null;
}

export interface JobInput {
  title: string;
  departmentId: string | null;
  branchId: string | null;
  vacancies: number;
  status: Job['status'];
  postedDate: string;
  closingDate: string | null;
  description: string | null;
}

export type JobUpdateInput = Partial<JobInput>;

export interface CandidateInput {
  name: string;
  email: string;
  phone?: string | null;
  jobId: string;
  jobTitle?: string;
  stage?: Candidate['stage'];
  appliedDate?: string;
  resume?: string | null;
  notes?: string | null;
  rating?: number | null;
  source?: string | null;
}

export type CandidateUpdateInput = Partial<CandidateInput>;

export interface InterviewInput {
  candidateId: string;
  date: string;
  time?: string;
  mode?: string;
  interviewer?: string;
  interviewerId?: string | null;
  round?: string;
  status?: string;
}

export interface OfferInput {
  candidateId: string;
  salary?: number;
  joiningDate?: string | null;
  status?: string;
  notes?: string | null;
}

function mapJob(db: JobRowWithJoins): Job {
  return {
    id: db.id,
    title: db.title,
    department: db.departments?.name || '',
    branch: db.branches?.name || '',
    vacancies: db.vacancies ?? 0,
    applicants: db.applicants ?? 0,
    status: db.status,
    postedDate: db.posted_date,
    closingDate: db.closing_date ?? '',
    description: db.description ?? '',
  };
}

export async function getJobs(): Promise<Job[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('id, title, vacancies, applicants, status, posted_date, closing_date, description, departments(name), branches(name)')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as JobRowWithJoins[]).map(mapJob);
}

export async function getJob(id: string): Promise<Job> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('jobs')
    .select('*, departments(name), branches(name)')
    .eq('id', id)
    .single();

  if (error) throw new Error(error.message);
  const d = data as unknown as JobRowWithJoins;
  return {
    id: d.id,
    title: d.title,
    department: d.departments?.name || '',
    branch: d.branches?.name || '',
    vacancies: d.vacancies ?? 0,
    applicants: d.applicants ?? 0,
    status: d.status,
    postedDate: d.posted_date,
    closingDate: d.closing_date ?? '',
    description: d.description ?? '',
  };
}

export async function createJob(data: JobInput): Promise<Job> {
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
  return mapJob(row as unknown as JobRowWithJoins);
}

export async function updateJob(id: string, data: JobUpdateInput): Promise<Job> {
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
  return mapJob(row as unknown as JobRowWithJoins);
}

export async function deleteJob(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('jobs').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
}

export async function getCandidates(jobId?: string): Promise<Candidate[]> {
  const supabase = await createClient();
  let query = supabase.from('candidates').select('id, name, email, phone, job_id, stage, applied_date, resume, notes, rating, source, jobs(title)').order('created_at', { ascending: false });
  if (jobId) {
    query = query.eq('job_id', jobId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as CandidateRowWithJob[]).map((db: CandidateRowWithJob) => ({
    id: db.id,
    name: db.name,
    email: db.email,
    phone: db.phone ?? '',
    jobId: db.job_id,
    jobTitle: db.jobs?.title || '',
    stage: db.stage,
    appliedDate: db.applied_date,
    resume: db.resume ?? undefined,
    notes: db.notes ?? undefined,
    rating: db.rating ?? undefined,
    source: db.source || 'Other',
  }));
}

export async function createCandidate(data: CandidateInput) {
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
  const r = row as unknown as CandidateRowWithJob;
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
  const { error } = await supabase.from('candidates').update({ stage: stage as CandidateStage }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
}

export async function updateCandidate(id: string, data: CandidateUpdateInput) {
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
  return (data || []).map((row: CandidateHistoryRow) => ({
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

function mapInterview(db: InterviewRowWithCandidate) {
  return {
    id: db.id,
    candidateId: db.candidate_id,
    candidateName: db.candidates?.name || '',
    date: db.date,
    time: db.time || '10:00',
    mode: db.mode || 'In-person',
    // HEAD schema stores the name in `interviewer_name`, THEIRS in `interviewer`.
    interviewer: db.interviewer_name ?? db.interviewer ?? '',
    interviewerId: db.interviewer_id ?? undefined,
    round: db.round || 'Round 1',
    status: (db.status || 'Scheduled') as InterviewStatus,
    feedback: db.feedback || undefined,
    rating: db.rating ?? undefined,
  };
}

function isMissingColumn(error: PostgrestError | null, ...cols: string[]): boolean {
  const msg = error?.message;
  return typeof msg === 'string' && cols.some((c) => msg.includes(c));
}
export async function getInterviews() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('interviews')
    .select('*, candidates(name)')
    .order('date', { ascending: true });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as InterviewRowWithCandidate[]).map(mapInterview);
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
  return (row as unknown as { id: string } | null)?.id as string;
}

export async function createInterview(data: InterviewInput) {
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
  return mapInterview(row as unknown as InterviewRowWithCandidate);
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
  const patch: InterviewUpdate = {};
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
    .update(patch)
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
      .update(patch)
      .eq('id', id)
      .select('*, candidates(name)')
      .single());
  }
  if (error) throw new Error(error.message);
  revalidatePath('/recruitment');
  return mapInterview(row as unknown as InterviewRowWithCandidate);
}

/* ------------------------------------------------------------------ */
/*  Offers (one row per candidate)                                     */
/* ------------------------------------------------------------------ */

function mapOffer(db: OfferRowWithCandidate) {
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
  return ((data ?? []) as unknown as OfferRowWithCandidate[]).map(mapOffer);
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

export async function upsertOffer(data: OfferInput) {
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
  return mapOffer(row as unknown as OfferRowWithCandidate);
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
  return mapOffer(row as unknown as OfferRowWithCandidate);
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
  const c: CandidateRow = cand;

  async function resolveId(table: 'departments' | 'designations' | 'branches', name: string): Promise<string | null> {
    if (!name) return null;
    const { data } = await supabase.from(table).select('id').ilike('name', name).limit(1).single();
    return (data as unknown as { id: string } | null)?.id || null;
  }

  const [first, ...rest] = (c.name || '').split(' ');
  // Resolve FK ids concurrently (was 3 sequential round trips).
  const [departmentId, designationId, branchId] = await Promise.all([
    resolveId('departments', data.department),
    resolveId('designations', data.designation),
    resolveId('branches', data.branch),
  ]);
  const { data: emp, error: empErr } = await supabase
    .from('employees')
    .insert([{
      employee_code: data.employeeCode || `CQ-${Date.now().toString().slice(-6)}`,
      first_name: first || c.name,
      last_name: rest.join(' ') || '',
      email: c.email,
      phone: c.phone,
      department_id: departmentId,
      designation_id: designationId,
      branch_id: branchId,
      employment_type: 'Full-time',
      joining_date: data.joiningDate,
      status: 'Probation',
      salary: data.salary || null,
    }])
    .select('id')
    .single();
  if (empErr) throw new Error(empErr.message);

  await supabase.from('candidates').update({ stage: 'Hired' }).eq('id', data.candidateId);
  await addCandidateHistory(data.candidateId, 'Hired', `Converted to employee ${(emp as unknown as { id: string }).id}`);

  revalidatePath('/recruitment');
  revalidatePath('/employees');
  return (emp as unknown as { id: string }).id as string;
}

/* ------------------------------------------------------------------ */
/*  Optimized single-call loader (dashboard-style)                     */
/* ------------------------------------------------------------------ */

export interface RecruitmentInterviewer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
}

export interface RecruitmentData {
  jobs: Job[];
  candidates: Candidate[];
  interviews: ReturnType<typeof mapInterview>[];
  offers: ReturnType<typeof mapOffer>[];
  interviewers: RecruitmentInterviewer[];
  deptIdByName: Record<string, string>;
  branchIdByName: Record<string, string>;
}

/**
 * Single round trip for the recruitment page.
 *
 * Before: useRecruitment fired getEmployees (30 cols + 5 joins, only
 * id/name needed for the interviewer dropdown) + getLookupData (5 queries)
 * + getJobs + getCandidates + getInterviews + getOffers across 2 sequential
 * waves. Now: one server action, everything in Promise.all with lean selects.
 * Old granular getters are kept for quiet refreshes after mutations.
 */
export async function getRecruitmentData(): Promise<RecruitmentData> {
  const supabase = await createClient();

  const [
    jobsRes,
    candidatesRes,
    interviewsRes,
    offersRes,
    interviewersRes,
    departmentsRes,
    branchesRes,
  ] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, title, vacancies, applicants, status, posted_date, closing_date, description, departments(name), branches(name)')
      .order('created_at', { ascending: false }),
    supabase
      .from('candidates')
      .select('id, name, email, phone, job_id, stage, applied_date, resume, notes, rating, source, jobs(title)')
      .order('created_at', { ascending: false }),
    supabase
      .from('interviews')
      .select('*, candidates(name)')
      .order('date', { ascending: true }),
    supabase
      .from('offers')
      .select('id, candidate_id, salary, joining_date, status, notes, candidates(name)')
      .order('created_at', { ascending: false }),
    // Lean interviewer list — the page only needs id + name + designation for the dropdown.
    supabase
      .from('employees')
      .select('id, first_name, last_name, email, designations(name)')
      .eq('status', 'Active')
      .order('first_name', { ascending: true }),
    supabase.from('departments').select('id, name'),
    supabase.from('branches').select('id, name, city'),
  ]);

  for (const [res, label] of [
    [jobsRes, 'jobs'],
    [candidatesRes, 'candidates'],
    [interviewsRes, 'interviews'],
    [offersRes, 'offers'],
  ] as const) {
    if ((res as { error: unknown }).error) throw new Error(`Failed to load ${label}`);
  }

  const deptIdByName: Record<string, string> = {};
  for (const d of (departmentsRes.data ?? []) as Array<{ id: string; name: string }>) {
    deptIdByName[d.name.toLowerCase()] = d.id;
  }
  const branchIdByName: Record<string, string> = {};
  for (const b of (branchesRes.data ?? []) as Array<{ id: string; name: string }>) {
    const short = b.name.split(' - ')[0].toLowerCase();
    branchIdByName[short] = b.id;
    branchIdByName[b.name.toLowerCase()] = b.id;
  }

  return {
    jobs: ((jobsRes.data ?? []) as unknown as JobRowWithJoins[]).map(mapJob),
    candidates: ((candidatesRes.data ?? []) as unknown as CandidateRowWithJob[]).map((db: CandidateRowWithJob) => ({
      id: db.id,
      name: db.name,
      email: db.email,
      phone: db.phone ?? '',
      jobId: db.job_id,
      jobTitle: db.jobs?.title || '',
      stage: db.stage,
      appliedDate: db.applied_date,
      resume: db.resume ?? undefined,
      notes: db.notes ?? undefined,
      rating: db.rating ?? undefined,
      source: db.source || 'Other',
    })) as Candidate[],
    interviews: ((interviewsRes.data ?? []) as unknown as InterviewRowWithCandidate[]).map(mapInterview),
    offers: ((offersRes.data ?? []) as unknown as OfferRowWithCandidate[]).map(mapOffer),
    interviewers: ((interviewersRes.data ?? []) as unknown as Array<{ id: string; first_name: string; last_name: string; email: string; designations: { name: string } | null }>).map((e) => ({
      id: e.id,
      firstName: e.first_name ?? '',
      lastName: e.last_name ?? '',
      email: (e as { email?: string }).email ?? '',
      designation: e.designations?.name ?? '',
    })),
    deptIdByName,
    branchIdByName,
  };
}
