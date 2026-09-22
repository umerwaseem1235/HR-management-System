import { useEffect, useMemo, useState } from 'react';
import { mockJobs, mockCandidates, mockEmployees } from '@/lib/mock-data';
import {
  getJobs, createJob, updateJob, deleteJob as deleteJobAction,
  getCandidates, createCandidate, updateCandidateStage, updateCandidate,
  deleteCandidate as deleteCandidateAction,
  getInterviews, createInterview, updateInterview,
  getOffers, upsertOffer, updateOfferStatus,
} from '@/lib/actions/recruitment';
import { getDepartments, getBranches } from '@/lib/actions/settings';
import { uploadCvFile, removeCvFile, getCvDownloadUrl } from '@/lib/actions/cv-storage';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Candidate, Job } from '@/types';
import { CandidateExt, Interview, Offer, SOURCES, STAGES, today } from '../types';

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9.\-_]/g, '_');

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
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState('');
  const [isSavingJob, setIsSavingJob] = useState(false);
  const [candidates, setCandidates] = useState<CandidateExt[]>(() =>
    mockCandidates.map(c => ({ ...c, source: c.id === '2' ? 'Referral' : c.id === '3' ? 'Walk-in' : 'Internal', history: [{ date: c.appliedDate, action: 'Applied', note: `Noted for ${c.jobTitle}` }] }))
  );
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [recLoading, setRecLoading] = useState(true);
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
  const [offerModal, setOfferModal] = useState<{ candidateId: string; salary: string; joiningDate: string; notes: string } | null>(null);
  const [offerView, setOfferView] = useState<{ cand: CandidateExt; offer: Offer } | null>(null);
  const [convertModal, setConvertModal] = useState<{ candidateId: string; code: string; department: string; designation: string; branch: string; joiningDate: string; salary: string } | null>(null);
  const [confirmDeleteJob, setConfirmDeleteJob] = useState<Job | null>(null);
  const [confirmCancelInterview, setConfirmCancelInterview] = useState<Interview | null>(null);
  const [pipeFilter, setPipeFilter] = useState('');

  const pushHistory = (id: string, action: string, note?: string) =>
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, history: [...c.history, { date: today(), action, note }] } : c));

  const moveStage = async (id: string, stage: Candidate['stage'], note?: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
    pushHistory(id, stage, note || `Moved to ${stage}`);
    try {
      await updateCandidateStage(id, stage);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to update candidate stage.');
    }
  };

  const refreshOffersQuietly = async () => {
    try {
      const rows = await getOffers();
      setOffers(rows.map(r => ({ ...r, status: r.status as Offer['status'] })));
    } catch {
      // Keep current state — the write already succeeded.
    }
  };

  const openNewJob = () =>
    setJobModal({ title: '', department: '', branch: '', vacancies: '1', requirements: '', description: '', closingDate: '', status: 'Open' });

  const openEditJob = (job: Job) => {
    const [desc, req] = job.description.split('\nRequirements:');
    setJobModal({ id: job.id, title: job.title, department: job.department, branch: job.branch, vacancies: String(job.vacancies), requirements: req?.trim() || '', description: desc?.trim() || '', closingDate: job.closingDate, status: job.status });
  };

  // ---- jobs (persisted in Supabase `jobs` table) ----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const dbJobs = await getJobs();
        if (!cancelled) {
          setJobs(dbJobs);
          setJobsError('');
        }
      } catch (err) {
        if (!cancelled) {
          // Keep mock fallback so the page still works when DB is unreachable,
          // but surface the real error so it can be fixed.
          setJobsError(err instanceof Error ? err.message : 'Failed to load free positions.');
        }
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
      // ---- candidates / interviews / offers (persisted in Supabase) ----
      try {
        const rows = await getCandidates();
        if (!cancelled) {
          setCandidates(rows.map(c => ({
            ...(c as Candidate),
            source: (c as Candidate & { source?: string }).source || 'Other',
            history: [{ date: (c as Candidate).appliedDate, action: 'Applied', note: `Noted for ${(c as Candidate).jobTitle}` }],
          })));
        }
      } catch (err) {
        if (!cancelled) setJobsError(err instanceof Error ? err.message : 'Failed to load candidates.');
      }
      try {
        const rows = await getInterviews();
        if (!cancelled) setInterviews(rows.map(r => ({ ...r, status: r.status as Interview['status'] })));
      } catch (err) {
        if (!cancelled) setJobsError(err instanceof Error ? err.message : 'Failed to load interviews. Run migration 004_recruitment_interviews_offers.sql in Supabase SQL Editor.');
      }
      try {
        const rows = await getOffers();
        if (!cancelled) setOffers(rows.map(r => ({ ...r, status: r.status as Offer['status'] })));
      } catch (err) {
        if (!cancelled) setJobsError(err instanceof Error ? err.message : 'Failed to load offers. Run migration 004_recruitment_interviews_offers.sql in Supabase SQL Editor.');
      }
      if (!cancelled) setRecLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const refreshJobsQuietly = async () => {
    try {
      setJobs(await getJobs());
    } catch {
      // Keep the optimistic state — the write already succeeded.
    }
  };

  const closeJob = async (id: string) => {
    const job = jobs.find(j => j.id === id);
    setJobs(p => p.map(j => j.id === id ? { ...j, status: 'Closed' } : j));
    try {
      if (job) await persistJobStatus(job, 'Closed');
      await refreshJobsQuietly();
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to close vacancy.');
    }
  };

  const reopenJob = async (id: string) => {
    const job = jobs.find(j => j.id === id);
    setJobs(p => p.map(j => j.id === id ? { ...j, status: 'Open' } : j));
    try {
      if (job) await persistJobStatus(job, 'Open');
      await refreshJobsQuietly();
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to reopen vacancy.');
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
      return;
    }
    setSuccess('Vacancy deleted.');
    await refreshJobsQuietly();
  };

  // ---- jobs ----
  const saveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobModal || isSavingJob) return;
    if (!jobModal.title.trim() || !jobModal.department || !jobModal.branch) return;
    setIsSavingJob(true);
    setJobsError('');
    try {
      const description = `${jobModal.description.trim()}${jobModal.requirements.trim() ? `\nRequirements: ${jobModal.requirements.trim()}` : ''}`;
      const vacancies = Math.max(1, Number(jobModal.vacancies) || 1);
      const closingDate = jobModal.closingDate || today();
      const { departmentId, branchId } = await resolveDeptBranchIds(jobModal.department, jobModal.branch);
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
      setJobsError(err instanceof Error ? err.message : 'Failed to save vacancy.');
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
    }
    const payload = {
      name: v.name, email: v.email, phone: v.phone,
      jobId: v.jobId, jobTitle: job?.title || '', stage: (v.stage as Candidate['stage']) || 'Applied',
      appliedDate: today(), resume: resumePath,
      notes: v.notes,
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
      await refreshJobsQuietly();
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

  const openDetail = (cand: CandidateExt) => {
    setDetail(candidates.find(c => c.id === cand.id) || null);
    setNoteText('');
  };

  const addDetailNote = () => {
    if (!noteText.trim() || !detail) return;
    pushHistory(detail.id, 'Note', noteText.trim());
    setDetail({ ...detail, history: [...detail.history, { date: today(), action: 'Note', note: noteText.trim() }] });
    setNoteText('');
  };

  const openInterviewFor = (candidateId: string) =>
    setIntModal({ candidateId, date: today(), time: '10:00', mode: 'In-person', interviewer: '', round: 'Round 1' });

  const openOfferFor = (candidateId: string) =>
    setOfferModal({ candidateId, salary: '', joiningDate: today(), notes: '' });

  const openConvertFor = (cand: CandidateExt) =>
    setConvertModal({ candidateId: cand.id, code: '', department: jobs.find(j => j.id === cand.jobId)?.department || '', designation: '', branch: jobs.find(j => j.id === cand.jobId)?.branch || '', joiningDate: today(), salary: '' });

  const scheduleInterview = async () => {
    if (!intModal || !intModal.candidateId || !intModal.date) return;
    if (!intModal.interviewer) return;
    const cand = candidates.find(c => c.id === intModal.candidateId);
    const emp = mockEmployees.find(e => e.id === intModal.interviewer);
    const interviewerName = emp ? `${emp.firstName} ${emp.lastName}` : intModal.interviewer;
    const payload = {
      candidateId: intModal.candidateId, date: intModal.date, time: intModal.time || '10:00',
      mode: intModal.mode, interviewer: interviewerName, interviewerId: emp?.id, round: intModal.round || 'Round 1',
    };
    try {
      const saved = await createInterview(payload);
      setInterviews(prev => [...prev, { ...saved, status: saved.status as Interview['status'] }]);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to schedule interview.');
      return;
    }
    if (cand) {
      addNotification({
        title: 'Interview Assigned',
        message: `${interviewerName}, you have to take interview of ${cand.name} (${cand.jobTitle}) on ${intModal.date} at ${intModal.time || '10:00'} · ${intModal.mode}.`,
        type: 'info',
        link: '/recruitment',
      });
    }
    if (cand && cand.stage === 'Applied') await moveStage(cand.id, 'Screening', 'Auto-moved on interview schedule');
    if (cand && (cand.stage === 'Screening' || cand.stage === 'Applied')) await moveStage(cand.id, 'Interview', `Interview scheduled ${intModal.date} · Interviewer: ${interviewerName}`);
    else if (cand) pushHistory(cand.id, 'Interview Scheduled', `${intModal.date} ${intModal.time} · ${intModal.mode} · Interviewer: ${interviewerName}`);
    setIntModal(null);
    setActiveTab('interviews');
    setSuccess(`Interview scheduled. Notification sent to ${interviewerName}.`);
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
      setJobsError(err instanceof Error ? err.message : 'Failed to record offer.');
      return;
    }
    setOfferModal(null);
    setActiveTab('offers');
    setSuccess('Offer recorded.');
  };

  const changeOfferStatus = async (o: Offer, status: Offer['status']) => {
    setOffers(p => p.map(x => x.id === o.id ? { ...x, status } : x));
    const cand = candidates.find(c => c.id === o.candidateId);
    if (!cand) return;
    try {
      await updateOfferStatus(o.candidateId, status);
    } catch (err) {
      setJobsError(err instanceof Error ? err.message : 'Failed to update offer status.');
      await refreshOffersQuietly();
      return;
    }
    if (status === 'Accepted') await moveStage(cand.id, 'Hired', 'Offer accepted');
    if (status === 'Rejected') await moveStage(cand.id, 'Rejected', 'Offer rejected');
  };

  const convertToEmployee = () => {
    if (!convertModal) return;
    const cand = candidates.find(c => c.id === convertModal.candidateId);
    if (!cand) return;
    const [first, ...rest] = cand.name.split(' ');
    mockEmployees.push({
      id: `emp-${Date.now()}`, employeeCode: convertModal.code || `CQ-${String(mockEmployees.length + 1).padStart(3, '0')}`,
      firstName: first || cand.name, lastName: rest.join(' ') || '', email: cand.email, phone: cand.phone,
      dateOfBirth: '', gender: 'Other', address: '', city: '', country: '',
      emergencyContactName: '', emergencyContactPhone: '',
      department: convertModal.department, designation: convertModal.designation, branch: convertModal.branch,
      reportingManager: '', employmentType: 'Full-time', joiningDate: convertModal.joiningDate || today(),
      status: 'Probation', shift: 'Morning Shift', salary: Number(convertModal.salary) || 0,
    } as never);
    moveStage(cand.id, 'Hired', `Converted to employee ${convertModal.code}`);
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
  };

  const analytics = useMemo(() => {
    const bySource = SOURCES.map(s => ({ s, n: candidates.filter(c => (c.source || 'Other') === s).length })).filter(x => x.n > 0);
    const byStage = STAGES.map(s => ({ s, n: candidates.filter(c => c.stage === s).length }));
    const hired = candidates.filter(c => c.stage === 'Hired').length;
    return { bySource, byStage, hired, conv: candidates.length ? Math.round(hired / candidates.length * 100) : 0 };
  }, [candidates]);

  const tabs = [
    { id: 'jobs', label: 'Free Positions', count: jobs.filter(j => j.status === 'Open').length },
    { id: 'candidates', label: 'Candidates Diary', count: candidates.length },
    { id: 'pipeline', label: 'Status' },
    { id: 'interviews', label: 'Reminders', count: interviews.filter(i => i.status === 'Scheduled').length },
    { id: 'offers', label: 'Offers Noted', count: offers.length },
    { id: 'analytics', label: 'Summary' },
  ];

  return {
    activeTab, setActiveTab,
    jobs, candidates, interviews, offers, success, setSuccess,
    jobsLoading, jobsError, setJobsError, isSavingJob, recLoading,
    jobModal, setJobModal, candModal, setCandModal,
    editCandModal, setEditCandModal, isSavingCand,
    confirmDeleteCand, setConfirmDeleteCand,
    detail, setDetail, noteText, setNoteText,
    intModal, setIntModal,
    offerModal, setOfferModal, offerView, setOfferView,
    convertModal, setConvertModal,
    confirmDeleteJob, setConfirmDeleteJob,
    confirmCancelInterview, setConfirmCancelInterview,
    pipeFilter, setPipeFilter,
    pushHistory, moveStage,
    openNewJob, openEditJob, closeJob, reopenJob, deleteJob, saveJob,
    addCandidate, openDetail, addDetailNote, downloadResume,
    openEditCandidate, saveEditCandidate, removeCandidate,
    openInterviewFor, openOfferFor, openConvertFor,
    scheduleInterview, saveOffer, changeOfferStatus,
    convertToEmployee, cancelInterview,
    analytics, tabs,
  };
}

export type UseRecruitmentReturn = ReturnType<typeof useRecruitment>;
