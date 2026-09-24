import { useCallback, useEffect, useMemo, useState } from 'react';
// NOTE: `@/lib/mock-data` was deleted, so the small job/candidate fallbacks
// it used to export are inlined here. They seed the lists until real DB rows
// load. The 15-row mock employee directory was removed — the interviewer
// dropdown now uses the lean server list (id + name + designation).

const mockJobs: Job[] = [
  { id: '1', title: 'Senior Frontend Developer', department: 'Engineering', branch: 'Mumtaz Market', vacancies: 2, applicants: 15, status: 'Open', postedDate: '2024-01-02', closingDate: '2024-02-02', description: 'Looking for an experienced frontend developer with React/Next.js expertise.' },
  { id: '2', title: 'Marketing Specialist', department: 'Marketing', branch: 'Mumtaz Market', vacancies: 1, applicants: 8, status: 'Open', postedDate: '2024-01-05', closingDate: '2024-02-05', description: 'Digital marketing specialist with social media expertise.' },
  { id: '3', title: 'DevOps Engineer', department: 'Engineering', branch: 'Mumtaz Market', vacancies: 1, applicants: 12, status: 'Open', postedDate: '2023-12-20', closingDate: '2024-01-31', description: 'DevOps engineer with cloud infrastructure experience.' },
  { id: '4', title: 'Sales Executive', department: 'Sales', branch: 'Mumtaz Market', vacancies: 3, applicants: 20, status: 'On Hold', postedDate: '2023-12-15', closingDate: '2024-01-30', description: 'Sales executive with B2B experience.' },
];

const mockCandidates: Candidate[] = [
  { id: '1', name: 'John Smith', email: 'john.smith@email.com', phone: '+1-555-9001', jobId: '1', jobTitle: 'Senior Frontend Developer', stage: 'Interview', appliedDate: '2024-01-03', rating: 4 },
  { id: '2', name: 'Anna Wilson', email: 'anna.w@email.com', phone: '+1-555-9002', jobId: '1', jobTitle: 'Senior Frontend Developer', stage: 'Screening', appliedDate: '2024-01-05', rating: 3 },
  { id: '3', name: 'Carlos Mendez', email: 'carlos.m@email.com', phone: '+1-555-9003', jobId: '2', jobTitle: 'Marketing Specialist', stage: 'Applied', appliedDate: '2024-01-06' },
  { id: '4', name: 'Lisa Park', email: 'lisa.park@email.com', phone: '+1-555-9004', jobId: '1', jobTitle: 'Senior Frontend Developer', stage: 'Selected', appliedDate: '2024-01-02', rating: 5 },
  { id: '5', name: 'Mark Johnson', email: 'mark.j@email.com', phone: '+1-555-9005', jobId: '3', jobTitle: 'DevOps Engineer', stage: 'Interview', appliedDate: '2023-12-22', rating: 4 },
  { id: '6', name: 'Rachel Green', email: 'rachel.g@email.com', phone: '+1-555-9006', jobId: '1', jobTitle: 'Senior Frontend Developer', stage: 'Rejected', appliedDate: '2024-01-03', rating: 2 },
];
import { useNotifications } from '@/contexts/NotificationContext';
import type { Candidate, Employee, Job } from '@/types';
import {
  addCandidateHistory,
  convertCandidateToEmployee,
  createCandidate,
  createInterview,
  createJob,
  deleteCandidate as deleteCandidateAction,
  deleteJob as deleteJobAction,
  getCandidateHistory,
  getCandidates,
  getInterviews,
  getJobs,
  getOffers,
  getRecruitmentData,
  saveOffer as saveOfferAction,
  scheduleInterview as scheduleInterviewAction,
  updateCandidate,
  updateCandidateStage,
  updateInterview,
  updateJob,
  updateOfferStatus,
  upsertOffer,
} from '@/lib/actions/recruitment';
import { getDepartments, getBranches } from '@/lib/actions/settings';
import { uploadCvFile, removeCvFile, getCvDownloadUrl } from '@/lib/actions/cv-storage';
import { CandidateExt, Interview, Offer, SOURCES, STAGES, today } from '../types';
import { createResourceCache } from '@/lib/resource-cache';
import type { RecruitmentData } from '@/lib/actions/recruitment';

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9.\-_]/g, '_');

/** In-memory snapshot of everything the recruitment page renders. */
interface RecruitmentSnapshot {
  jobs: Job[];
  candidates: CandidateExt[];
  interviews: Interview[];
  offers: Offer[];
  interviewers: Employee[];
  deptIdByName: Record<string, string>;
  branchIdByName: Record<string, string>;
}

// Survives view remounts during navigation, so returning to /recruitment paints
// instantly instead of re-running the aggregate loader.
const recruitmentCache = createResourceCache<RecruitmentSnapshot>('recruitment:data', 60_000);

function toSnapshot(data: RecruitmentData): RecruitmentSnapshot {
  return {
    jobs: data.jobs,
    candidates: (data.candidates as any[]).map((c: any) => ({
      ...c,
      source: c.source || 'Other',
      history: [{ date: c.appliedDate, action: 'Applied', note: `Noted for ${c.jobTitle}` }],
    })),
    interviews: (data.interviews as any[]).map((r: any) => ({ ...r, status: r.status as Interview['status'] })),
    offers: (data.offers as any[]).map((r: any) => ({ ...r, status: r.status as Offer['status'] })),
    interviewers: data.interviewers as unknown as Employee[],
    deptIdByName: data.deptIdByName,
    branchIdByName: data.branchIdByName,
  };
}

export interface JobModalState {
  id?: string;
  title: string;
  department: string;
  branch: string;
  vacancies: string;
  requirements: string;
  description: string;
  closingDate: string;
  status: Job['status'];
}

export interface EditCandState {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  stage: Candidate['stage'];
  source: string;
  notes: string;
  resume?: string | null;
}

export function useRecruitment() {
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('jobs');
  // Mock fallback keeps the page working when the DB is unreachable (theirs);
  // real rows replace it once loaded (both sides).
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [candidates, setCandidates] = useState<CandidateExt[]>(() =>
    mockCandidates.map(c => ({ ...c, source: c.id === '2' ? 'Referral' : c.id === '3' ? 'Walk-in' : 'Internal', history: [{ date: c.appliedDate, action: 'Applied', note: `Noted for ${c.jobTitle}` }] }))
  );
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deptIdByName, setDeptIdByName] = useState<Record<string, string>>({});
  const [branchIdByName, setBranchIdByName] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [recLoading, setRecLoading] = useState(true);
  // Becomes true once real (or cached) data has been applied; gates the cache
  // write-back so the mock fallback initial state never overwrites the cache.
  const [ready, setReady] = useState(false);
  const [success, setSuccess] = useState('');

  // modals
  const [jobModal, setJobModal] = useState<JobModalState | null>(null);
  const [candModal, setCandModal] = useState(false);
  const [editCandModal, setEditCandModal] = useState<EditCandState | null>(null);
  const [isSavingCand, setIsSavingCand] = useState(false);
  const [confirmDeleteCand, setConfirmDeleteCand] = useState<CandidateExt | null>(null);
  const [detail, setDetail] = useState<CandidateExt | null>(null);
  const [noteText, setNoteText] = useState('');
  const [intModal, setIntModal] = useState<{ candidateId: string; date: string; time: string; mode: string; interviewer: string; round: string } | null>(null);
  const [fbModal, setFbModal] = useState<{ id: string; feedback: string; rating: string } | null>(null);
  const [offerModal, setOfferModal] = useState<{ candidateId: string; salary: string; joiningDate: string; notes: string } | null>(null);
  const [offerView, setOfferView] = useState<{ cand: CandidateExt; offer: Offer } | null>(null);
  const [convertModal, setConvertModal] = useState<{ candidateId: string; code: string; department: string; designation: string; branch: string; joiningDate: string; salary: string } | null>(null);
  const [confirmDeleteJob, setConfirmDeleteJob] = useState<Job | null>(null);
  const [confirmCancelInterview, setConfirmCancelInterview] = useState<Interview | null>(null);
  const [pipeFilter, setPipeFilter] = useState('');

  const refreshJobs = useCallback(async () => {
    setJobs(await getJobs());
  }, []);

  const refreshJobsQuietly = async () => {
    try {
      setJobs(await getJobs());
    } catch {
      // Keep the optimistic state — the write already succeeded.
    }
  };

  const refreshCandidates = useCallback(async () => {
    const list = await getCandidates();
    setCandidates(list.map((c: any) => ({
      ...c,
      source: c.source || 'Other',
      history: [] as CandidateExt['history'],
    })));
  }, []);

  const refreshInterviews = useCallback(async () => {
    const list = await getInterviews();
    setInterviews(list as Interview[]);
  }, []);

  const refreshOffers = useCallback(async () => {
    const list = await getOffers();
    setOffers(list as Offer[]);
  }, []);

  const refreshOffersQuietly = async () => {
    try {
      const rows = await getOffers();
      setOffers(rows.map(r => ({ ...r, status: r.status as Offer['status'] })));
    } catch {
      // Keep current state — the write already succeeded.
    }
  };

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshJobs(), refreshCandidates(), refreshInterviews(), refreshOffers()]);
  }, [refreshJobs, refreshCandidates, refreshInterviews, refreshOffers]);

  const loadHistory = useCallback(async (candidateId: string) => {
    try {
      const items = await getCandidateHistory(candidateId);
      setCandidates((prev) => prev.map((c) => (c.id === candidateId ? { ...c, history: items } : c)));
      return items;
    } catch {
      return [] as CandidateExt['history'];
    }
  }, []);

  const pushHistory = useCallback(
    async (id: string, action: string, note?: string) => {
      // Optimistic local entry so the UI updates instantly.
      setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, history: [...c.history, { date: today(), action, note }] } : c)));
      try {
        await addCandidateHistory(id, action, note);
        await loadHistory(id);
      } catch {
        // Keep the optimistic entry when the DB write fails.
      }
    },
    [loadHistory],
  );

  const moveStage = useCallback(
    async (id: string, stage: Candidate['stage'], note?: string) => {
      setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)));
      await pushHistory(id, stage, note || `Moved to ${stage}`);
      try {
        await updateCandidateStage(id, stage);
      } catch (err) {
        setJobsError(err instanceof Error ? err.message : 'Failed to update candidate stage.');
        setError(err instanceof Error ? err.message : 'Failed to update candidate stage.');
      }
      await loadHistory(id);
    },
    [loadHistory, pushHistory],
  );

  // Apply a cached/server snapshot to every state slice in one go.
  const hydrate = useCallback((snap: RecruitmentSnapshot) => {
    setEmployees(snap.interviewers);
    setDeptIdByName(snap.deptIdByName);
    setBranchIdByName(snap.branchIdByName);
    setJobs(snap.jobs);
    setCandidates(snap.candidates);
    setInterviews(snap.interviews);
    setOffers(snap.offers);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snapshot = recruitmentCache.peek();
      if (snapshot && !cancelled) {
        // Paint the cached page instantly; only fetch when it has gone stale.
        hydrate(snapshot.data);
        setReady(true);
        setIsLoading(false);
        setJobsLoading(false);
        setRecLoading(false);
        if (!snapshot.isStale) return;
      } else {
        setIsLoading(true);
      }
      setError(null);
      try {
        // ONE round trip: jobs + candidates + interviews + offers +
        // lean interviewers + dept/branch maps, all in parallel server-side.
        const data = await recruitmentCache.load(() => getRecruitmentData().then(toSnapshot));
        if (cancelled) return;
        hydrate(data);
        setReady(true);
        setJobsError('');
      } catch (err) {
        if (!cancelled) {
          // Keep mock fallback so the page still works when DB is unreachable,
          // but surface the real error so it can be fixed.
          const message = err instanceof Error ? err.message : 'Failed to load recruitment data.';
          setJobsError(message);
          setError((prev) => prev ?? message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setJobsLoading(false);
          setRecLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [hydrate]);

  // Keep the module-level snapshot in sync with every state change (loads,
  // optimistic mutations, granular refreshes) so the next mount is current.
  useEffect(() => {
    if (!ready) return;
    recruitmentCache.set({
      jobs,
      candidates,
      interviews,
      offers,
      interviewers: employees,
      deptIdByName,
      branchIdByName,
    });
  }, [ready, jobs, candidates, interviews, offers, employees, deptIdByName, branchIdByName]);

  const openNewJob = () =>
    setJobModal({ title: '', department: '', branch: '', vacancies: '1', requirements: '', description: '', closingDate: '', status: 'Open' });

  const openEditJob = (job: Job) => {
    const [desc, req] = job.description.split('\nRequirements:');
    setJobModal({ id: job.id, title: job.title, department: job.department, branch: job.branch, vacancies: String(job.vacancies), requirements: req?.trim() || '', description: desc?.trim() || '', closingDate: job.closingDate, status: job.status });
  };

  // UI uses department/branch NAMES, DB uses IDs — resolve via settings tables.
  const resolveDeptBranchIds = async (department: string, branch: string) => {
    const [depts, branches] = await Promise.all([getDepartments(), getBranches()]);
    const dept = depts.find(d => d.name.toLowerCase() === department.trim().toLowerCase());
    const br = branches.find(b => b.name.toLowerCase() === branch.trim().toLowerCase());
    return { departmentId: dept?.id ?? null, branchId: br?.id ?? null };
  };

  const persistJobStatus = async (job: Job, status: Job['status']) => {
    const { departmentId, branchId } = await resolveDeptBranchIds(job.department, job.branch);
    await updateJob(job.id, {
      title: job.title,
      departmentId,
      branchId,
      vacancies: job.vacancies,
      status,
      postedDate: job.postedDate,
      closingDate: job.closingDate,
      description: job.description,
    });
  };

  const closeJob = async (id: string) => {
    const job = jobs.find(j => j.id === id);
    setJobs(p => p.map(j => j.id === id ? { ...j, status: 'Closed' } : j));
    try {
      if (job) {
        const departmentId = deptIdByName[job.department.toLowerCase()];
        const branchId = branchIdByName[job.branch.toLowerCase()];
        if (departmentId && branchId) {
          await updateJob(id, { status: 'Closed' } as any);
        } else {
          await persistJobStatus(job, 'Closed');
        }
      } else {
        await updateJob(id, { status: 'Closed' } as any);
      }
      await refreshJobsQuietly();
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to close vacancy.');
      setError(err instanceof Error ? err.message : 'Failed to close vacancy.');
      await refreshJobsQuietly();
    }
  };

  const reopenJob = async (id: string) => {
    const job = jobs.find(j => j.id === id);
    setJobs(p => p.map(j => j.id === id ? { ...j, status: 'Open' } : j));
    try {
      if (job) {
        const departmentId = deptIdByName[job.department.toLowerCase()];
        const branchId = branchIdByName[job.branch.toLowerCase()];
        if (departmentId && branchId) {
          await updateJob(id, { status: 'Open' } as any);
        } else {
          await persistJobStatus(job, 'Open');
        }
      } else {
        await updateJob(id, { status: 'Open' } as any);
      }
      await refreshJobsQuietly();
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to reopen vacancy.');
      setError(err instanceof Error ? err.message : 'Failed to reopen vacancy.');
      await refreshJobsQuietly();
    }
  };

  const deleteJob = async (id: string) => {
    const prev = jobs;
    setJobs(p => p.filter(j => j.id !== id));
    try {
      await deleteJobAction(id);
    } catch (err) {
      // Write failed — roll back so nothing silently disappears.
      setJobs(prev);
      setJobsError(err instanceof Error ? err.message : 'Failed to delete vacancy.');
      setError(err instanceof Error ? err.message : 'Failed to delete vacancy.');
      return;
    }
    setSuccess('Vacancy deleted.');
    await refreshJobsQuietly();
    try {
      await refreshAll();
    } catch {
      // Quiet refresh already converged the list.
    }
  };

  const deleteJobById = deleteJob;

  // ---- jobs ----
  const saveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobModal || isSavingJob) return;
    if (!jobModal.title.trim() || !jobModal.department || !jobModal.branch) return;
    setIsSavingJob(true);
    setJobsError('');
    setError(null);
    try {
      const description = `${jobModal.description.trim()}${jobModal.requirements.trim() ? `\nRequirements: ${jobModal.requirements.trim()}` : ''}`;
      const vacancies = Math.max(1, Number(jobModal.vacancies) || 1);
      const closingDate = jobModal.closingDate || today();
      let departmentId = deptIdByName[jobModal.department.toLowerCase()];
      let branchId = branchIdByName[jobModal.branch.toLowerCase()];
      if (!departmentId || !branchId) {
        const resolved = await resolveDeptBranchIds(jobModal.department, jobModal.branch);
        departmentId = departmentId || resolved.departmentId || undefined as any;
        branchId = branchId || resolved.branchId || undefined as any;
      }
      if (!departmentId || !branchId) {
        const msg = 'Department or branch not found. Refresh and try again.';
        setError(msg);
        setJobsError(msg);
        setIsSavingJob(false);
        return;
      }
      const payload = {
        title: jobModal.title.trim(),
        departmentId,
        branchId,
        vacancies,
        description,
        closingDate,
        postedDate: today(),
        status: jobModal.status,
      };
      const wasEdit = !!jobModal.id;
      const prevApplicants = wasEdit
        ? jobs.find(j => j.id === jobModal.id)?.applicants ?? 0
        : 0;
      const saved = wasEdit
        ? await updateJob(jobModal.id as string, payload)
        : await createJob(payload);
      // Optimistic entry uses the names picked in the form so the row is
      // visible instantly even if the follow-up refetch fails.
      const visible: Job = {
        ...saved,
        department: jobModal.department,
        branch: jobModal.branch,
      };
      setJobs(prev =>
        wasEdit
          ? prev.map(j => j.id === visible.id ? { ...visible, applicants: prevApplicants } : j)
          : [{ ...visible, applicants: 0 }, ...prev]
      );
      setJobModal(null);
      setSuccess(wasEdit ? 'Vacancy updated.' : 'Vacancy created.');
      // Re-fetch so the list always converges to what is stored in the database.
      await refreshJobsQuietly();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save vacancy.';
      setJobsError(msg);
      setError(msg);
    } finally {
      setIsSavingJob(false);
    }
  };

  // ---- candidate (persisted in Supabase `candidates` table, CV in Storage) ----
  const downloadResume = async (path?: string | null) => {
    if (!path) return;
    try {
      const url = await getCvDownloadUrl(path);
      // Open directly once the link is ready — no intermediate blank tab.
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to download CV. It may have been uploaded before Storage was set up — please re-upload it.');
    }
  };

  const addCandidate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    const cv = fd.get('cv');
    if (!v.jobId || !v.name?.trim()) return;
    const job = jobs.find(j => j.id === v.jobId);
    // Upload the CV via the server (bucket auto-created) so the DB row always points to a real file.
    let resumePath: string | undefined;
    if (cv instanceof File && cv.name && cv.size > 0) {
      try {
        const uploadForm = new FormData();
        uploadForm.append('file', cv);
        uploadForm.append('path', `${Date.now()}_${sanitizeFileName(cv.name)}`);
        resumePath = await uploadCvFile(uploadForm);
      } catch (err) {
        setJobsError(err instanceof Error ? err.message : 'Failed to upload CV.');
        return;
      }
    } else if (cv instanceof File && cv.name) {
      resumePath = cv.name;
    }
    const payload = {
      name: v.name.trim(),
      email: v.email,
      phone: v.phone,
      jobId: v.jobId,
      jobTitle: job?.title || '',
      stage: (v.stage as Candidate['stage']) || 'Applied',
      appliedDate: today(),
      resume: resumePath,
      notes: v.notes,
      rating: (v as Record<string, string>).rating ? Number((v as Record<string, string>).rating) : undefined,
      source: v.source || 'Other',
    };
    try {
      const saved = await createCandidate(payload);
      const ext: CandidateExt = {
        ...(saved as Candidate),
        source: (saved as Candidate & { source?: string }).source || payload.source,
        history: [{ date: today(), action: 'Noted', note: `Manually noted for ${payload.jobTitle} via ${payload.source}` }],
      };
      setCandidates(prev => [ext, ...prev]);
      setJobs(prev => prev.map(j => j.id === v.jobId ? { ...j, applicants: j.applicants + 1 } : j));
      const created = { ...(saved as any), id: (saved as any)?.id };
      if (created?.id) {
        try {
          await addCandidateHistory(created.id, 'Applied', `Noted for ${job?.title || ''} via ${payload.source}`);
        } catch {
          // History is best-effort; the local entry above already shows it.
        }
      }
      await refreshJobsQuietly();
      try {
        await refreshCandidates();
      } catch {
        // Optimistic state already shows the new candidate.
      }
    } catch (err) {
      // DB write failed after the file was uploaded — remove the orphan file.
      if (resumePath) {
        try {
          await removeCvFile(resumePath);
        } catch {
          // Orphan cleanup failed silently; the file can be removed from Storage dashboard.
        }
      }
      // Keep the form open with data intact so nothing is lost — user can retry.
      setJobsError(err instanceof Error ? err.message : 'Failed to save candidate.');
      return;
    }
    form.reset();
    setCandModal(false);
    setActiveTab('candidates');
    setSuccess('Candidate added.');
  };

  const openEditCandidate = (cand: CandidateExt) =>
    setEditCandModal({
      id: cand.id, name: cand.name, email: cand.email, phone: cand.phone,
      jobId: cand.jobId, stage: cand.stage, source: cand.source || 'Other',
      notes: cand.notes || '', resume: cand.resume || null,
    });

  const saveEditCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCandModal || isSavingCand) return;
    if (!editCandModal.name.trim() || !editCandModal.email.trim() || !editCandModal.jobId) return;
    setIsSavingCand(true);
    setJobsError('');
    const prev = candidates;
    const patch = {
      name: editCandModal.name.trim(),
      email: editCandModal.email.trim(),
      phone: editCandModal.phone,
      jobId: editCandModal.jobId,
      stage: editCandModal.stage,
      source: editCandModal.source,
      notes: editCandModal.notes,
    };
    const jobTitle = jobs.find(j => j.id === patch.jobId)?.title || '';
    // Optimistic update so the list reflects the edit instantly.
    setCandidates(cs => cs.map(c => c.id === editCandModal.id ? { ...c, ...patch, jobTitle } : c));
    try {
      await updateCandidate(editCandModal.id, patch);
      await refreshJobsQuietly();
    } catch (err) {
      setCandidates(prev);
      setJobsError(err instanceof Error ? err.message : 'Failed to update candidate.');
      setIsSavingCand(false);
      return;
    }
    // Keep the open profile in sync if it shows this candidate.
    setDetail(d => d && d.id === editCandModal.id ? { ...d, ...patch, jobTitle } : d);
    setEditCandModal(null);
    setIsSavingCand(false);
    setSuccess('Candidate updated.');
  };

  const removeCandidate = async (id: string) => {
    const cand = candidates.find(c => c.id === id);
    const prevCands = candidates;
    const prevJobs = jobs;
    setCandidates(cs => cs.filter(c => c.id !== id));
    if (cand) {
      setJobs(js => js.map(j => j.id === cand.jobId ? { ...j, applicants: Math.max(0, j.applicants - 1) } : j));
      // Interviews/offers cascade in the DB — mirror that locally.
      setInterviews(ivs => ivs.filter(i => i.candidateId !== id));
      setOffers(os => os.filter(o => o.candidateId !== id));
    }
    setConfirmDeleteCand(null);
    if (detail?.id === id) setDetail(null);
    try {
      await deleteCandidateAction(id);
      // Remove the stored CV file too (best effort — DB row is already gone).
      if (cand?.resume) {
        try {
          await removeCvFile(cand.resume);
        } catch {
          // File cleanup failed silently; removable from Storage dashboard.
        }
      }
      await refreshJobsQuietly();
    } catch (err) {
      setCandidates(prevCands);
      setJobs(prevJobs);
      setJobsError(err instanceof Error ? err.message : 'Failed to delete candidate.');
      return;
    }
    setSuccess(`Candidate${cand ? ` ${cand.name}` : ''} deleted.`);
  };

  const deleteCandidateById = async (id: string) => {
    try {
      await deleteCandidateAction(id);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to delete candidate.');
      return;
    }
    try {
      await refreshAll();
    } catch {
      setCandidates(prev => prev.filter(c => c.id !== id));
    }
    setConfirmDeleteCand(null);
    if (detail?.id === id) setDetail(null);
    setSuccess('Candidate deleted.');
  };

  const openDetail = async (cand: CandidateExt) => {
    setDetail(candidates.find((c) => c.id === cand.id) || null);
    setNoteText('');
    const items = await loadHistory(cand.id);
    setDetail((prev) => (prev && prev.id === cand.id ? { ...prev, history: items.length > 0 ? items : prev.history } : prev));
  };

  const addDetailNote = async () => {
    if (!noteText.trim() || !detail) return;
    await pushHistory(detail.id, 'Note', noteText.trim());
    const items = await loadHistory(detail.id);
    setDetail({ ...detail, history: items.length > 0 ? items : [...detail.history, { date: today(), action: 'Note', note: noteText.trim() }] });
    setNoteText('');
  };

  const openInterviewFor = (candidateId: string) =>
    setIntModal({ candidateId, date: today(), time: '10:00', mode: 'In-person', interviewer: '', round: 'Round 1' });

  const openOfferFor = (candidateId: string) =>
    setOfferModal({ candidateId, salary: '', joiningDate: today(), notes: '' });

  const openConvertFor = (cand: CandidateExt) =>
    setConvertModal({ candidateId: cand.id, code: '', department: jobs.find((j) => j.id === cand.jobId)?.department || '', designation: '', branch: jobs.find((j) => j.id === cand.jobId)?.branch || '', joiningDate: today(), salary: '' });

  const openFeedbackFor = (id: string) => setFbModal({ id, feedback: '', rating: '' });

  const scheduleInterview = async () => {
    if (!intModal || !intModal.candidateId || !intModal.date) return;
    if (!intModal.interviewer) return;
    const cand = candidates.find((c) => c.id === intModal.candidateId);
    const emp = employees.find((x) => x.id === intModal.interviewer);
    const interviewerName = emp ? `${(emp as any).firstName} ${(emp as any).lastName}` : intModal.interviewer;
    const payload = {
      candidateId: intModal.candidateId,
      date: intModal.date,
      time: intModal.time || '10:00',
      mode: intModal.mode,
      interviewer: interviewerName,
      interviewerId: (emp as any)?.id,
      round: intModal.round || 'Round 1',
    };
    let saved: any = null;
    try {
      saved = await scheduleInterviewAction(payload);
    } catch {
      try {
        saved = await createInterview(payload);
      } catch (err) {
        setJobsError(err instanceof Error ? err.message : 'Failed to schedule interview.');
        return;
      }
    }
    if (saved) {
      setInterviews((prev) => [...prev, { ...saved, status: (saved.status as Interview['status']) ?? 'Scheduled' }]);
    }
    try {
      await refreshInterviews();
    } catch {
      // Optimistic entry above already shows the interview.
    }
    if (cand) {
      addNotification({
        title: 'Interview Assigned',
        message: `${interviewerName}, you have to take interview of ${cand.name} (${cand.jobTitle}) on ${intModal.date} at ${intModal.time || '10:00'} · ${intModal.mode}.`,
        type: 'info',
        link: '/recruitment',
      }).catch(() => undefined);
    }
    if (cand && cand.stage === 'Applied') await moveStage(cand.id, 'Screening', 'Auto-moved on interview schedule');
    if (cand && (cand.stage === 'Screening' || cand.stage === 'Applied')) {
      await moveStage(cand.id, 'Interview', `Interview scheduled ${intModal.date} · Interviewer: ${interviewerName}`);
    } else if (cand) {
      await pushHistory(cand.id, 'Interview Scheduled', `${intModal.date} ${intModal.time} · ${intModal.mode} · Interviewer: ${interviewerName}`);
    }
    setIntModal(null);
    setActiveTab('interviews');
    setSuccess(`Interview scheduled. Notification sent to ${interviewerName}.`);
  };

  const saveFeedback = async () => {
    if (!fbModal) return;
    await updateInterview(fbModal.id, {
      status: 'Completed',
      feedback: fbModal.feedback,
      rating: Number(fbModal.rating) || undefined,
    });
    const iv = interviews.find((i) => i.id === fbModal.id);
    if (iv) {
      await pushHistory(iv.candidateId, 'Feedback', fbModal.feedback || `Rated ${fbModal.rating}`);
      if (fbModal.rating) {
        await updateCandidate(iv.candidateId, { rating: Number(fbModal.rating) } as any);
        await refreshCandidates();
      }
    }
    await refreshInterviews();
    setFbModal(null);
    setSuccess('Feedback saved.');
  };

  const saveOfferFor = async () => {
    if (!offerModal || !offerModal.candidateId) return;
    const cand = candidates.find((c) => c.id === offerModal.candidateId);
    await saveOfferAction({
      candidateId: offerModal.candidateId,
      salary: Math.max(0, Number(offerModal.salary) || 0),
      joiningDate: offerModal.joiningDate || today(),
      notes: offerModal.notes,
    });
    if (cand) {
      await moveStage(cand.id, 'Offer', `Offer $${Math.max(0, Number(offerModal.salary) || 0)} · joining ${offerModal.joiningDate || today()}`);
    }
    await refreshOffers();
    setOfferModal(null);
    setActiveTab('offers');
    setSuccess('Offer recorded.');
  };

  const saveOffer = async () => {
    if (!offerModal || !offerModal.candidateId) return;
    const cand = candidates.find(c => c.id === offerModal.candidateId);
    const payload = {
      candidateId: offerModal.candidateId,
      salary: Math.max(0, Number(offerModal.salary) || 0), joiningDate: offerModal.joiningDate || today(),
      status: 'Sent', notes: offerModal.notes,
    };
    try {
      const saved = await upsertOffer(payload);
      const offer: Offer = { ...saved, status: saved.status as Offer['status'] };
      setOffers(prev => { const ex = prev.find(o => o.candidateId === offer.candidateId); return ex ? prev.map(o => o.candidateId === offer.candidateId ? { ...offer, id: o.id } : o) : [...prev, offer]; });
      if (cand) await moveStage(cand.id, 'Offer', `Offer PKR ${offer.salary} · joining ${offer.joiningDate}`);
    } catch (err) {
      // Fall back to the plain save path (works when the upsert RPC is missing).
      try {
        await saveOfferFor();
        return;
      } catch {
        setJobsError(err instanceof Error ? err.message : 'Failed to record offer.');
        return;
      }
    }
    setOfferModal(null);
    setActiveTab('offers');
    setSuccess('Offer recorded.');
  };

  const changeOfferStatus = async (o: Offer, status: Offer['status']) => {
    const target = offers.find((x) => x.id === o.id) || o;
    setOffers((p) => p.map((x) => (x.id === target.id ? { ...x, status } : x)));
    const cand = candidates.find((c) => c.id === target.candidateId);
    if (!cand) return;
    try {
      try {
        await updateOfferStatus(target.id, status);
      } catch {
        await updateOfferStatus(target.candidateId, status);
      }
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to update offer status.');
      await refreshOffersQuietly();
      try {
        await refreshOffers();
      } catch {
        // Optimistic state already applied.
      }
      return;
    }
    if (status === 'Accepted') await moveStage(cand.id, 'Hired', 'Offer accepted');
    if (status === 'Rejected') await moveStage(cand.id, 'Rejected', 'Offer rejected');
  };

  const convertToEmployee = async () => {
    if (!convertModal) return;
    const cand = candidates.find((c) => c.id === convertModal.candidateId);
    if (!cand) return;
    try {
      await convertCandidateToEmployee({
        candidateId: cand.id,
        employeeCode: convertModal.code || undefined,
        department: convertModal.department,
        designation: convertModal.designation,
        branch: convertModal.branch,
        joiningDate: convertModal.joiningDate || today(),
        salary: Number(convertModal.salary) || 0,
      });
      await refreshCandidates();
      await loadHistory(cand.id);
    } catch {
      // DB conversion failed — keep the candidate and surface the stage move
      // so HR can retry instead of silently duplicating a local-only record.
      await moveStage(cand.id, 'Hired', `Converted to employee ${convertModal.code}`);
    }
    setConvertModal(null);
    setSuccess(`${cand.name} converted to employee.`);
  };

  const cancelInterview = async (id: string) => {
    try {
      await updateInterview(id, { status: 'Cancelled' });
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to cancel interview.');
      return;
    }
    setInterviews(p => p.map(x => x.id === id ? { ...x, status: 'Cancelled' } : x));
    try {
      await refreshInterviews();
    } catch {
      // Optimistic state already applied.
    }
  };

  const analytics = useMemo(() => {
    const bySource = SOURCES.map((s) => ({ s, n: candidates.filter((c) => (c.source || 'Other') === s).length })).filter((x) => x.n > 0);
    const byStage = STAGES.map((s) => ({ s, n: candidates.filter((c) => c.stage === s).length }));
    const hired = candidates.filter((c) => c.stage === 'Hired').length;
    return { bySource, byStage, hired, conv: candidates.length ? Math.round((hired / candidates.length) * 100) : 0 };
  }, [candidates]);

  const tabs = [
    { id: 'jobs', label: 'Free Positions', count: jobs.filter((j) => j.status === 'Open').length },
    { id: 'candidates', label: 'Candidates Diary', count: candidates.length },
    { id: 'pipeline', label: 'Status' },
    { id: 'interviews', label: 'Reminders', count: interviews.filter((i) => i.status === 'Scheduled').length },
    { id: 'offers', label: 'Offers Noted', count: offers.length },
    { id: 'analytics', label: 'Summary' },
  ];

  return {
    activeTab, setActiveTab,
    jobs, candidates, interviews, offers, employees, success, setSuccess,
    isLoading, error,
    jobsLoading, jobsError, setJobsError, isSavingJob, recLoading,
    jobModal, setJobModal, candModal, setCandModal,
    editCandModal, setEditCandModal, isSavingCand,
    confirmDeleteCand, setConfirmDeleteCand,
    detail, setDetail, noteText, setNoteText,
    intModal, setIntModal, fbModal, setFbModal,
    offerModal, setOfferModal, offerView, setOfferView,
    convertModal, setConvertModal,
    confirmDeleteJob, setConfirmDeleteJob,
    confirmCancelInterview, setConfirmCancelInterview,
    pipeFilter, setPipeFilter,
    pushHistory, moveStage, loadHistory,
    openNewJob, openEditJob, closeJob, reopenJob, deleteJob, deleteJobById, saveJob,
    addCandidate, openDetail, addDetailNote, downloadResume,
    deleteCandidate: deleteCandidateById, deleteCandidateById, removeCandidate,
    openEditCandidate, saveEditCandidate,
    openInterviewFor, openOfferFor, openConvertFor, openFeedbackFor,
    scheduleInterview, saveFeedback, saveOffer, saveOfferFor, changeOfferStatus,
    convertToEmployee, cancelInterview,
    refreshJobs, refreshCandidates, refreshInterviews, refreshOffers, refreshAll,
    refreshJobsQuietly, refreshOffersQuietly,
    analytics, tabs,
  };
}

export type UseRecruitmentReturn = ReturnType<typeof useRecruitment>;
