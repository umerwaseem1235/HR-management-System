import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Candidate, Employee, Job } from '@/types';
import {
  addCandidateHistory,
  convertCandidateToEmployee,
  createCandidate,
  createJob,
  deleteCandidate,
  deleteJob,
  getCandidateHistory,
  getCandidates,
  getInterviews,
  getJobs,
  getOffers,
  saveOffer,
  scheduleInterview as scheduleInterviewAction,
  updateCandidate,
  updateCandidateStage,
  updateInterview,
  updateJob,
  updateOfferStatus as updateOfferStatusAction,
} from '@/lib/actions/recruitment';
import { getEmployees } from '@/lib/actions/employees';
import { getLookupData } from '@/lib/actions/employees';
import { CandidateExt, Interview, Offer, SOURCES, STAGES, today } from '../types';

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

export function useRecruitment() {
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<CandidateExt[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deptIdByName, setDeptIdByName] = useState<Record<string, string>>({});
  const [branchIdByName, setBranchIdByName] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState('');

  // modals
  const [jobModal, setJobModal] = useState<JobModalState | null>(null);
  const [candModal, setCandModal] = useState(false);
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

  const refreshAll = useCallback(async () => {
    await Promise.all([refreshJobs(), refreshCandidates(), refreshInterviews(), refreshOffers()]);
  }, [refreshJobs, refreshCandidates, refreshInterviews, refreshOffers]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [empData, lookup] = await Promise.all([getEmployees(), getLookupData()]);
        if (cancelled) return;
        setEmployees(empData);
        const dMap: Record<string, string> = {};
        lookup.departments.forEach((d) => { dMap[d.name.toLowerCase()] = d.id; });
        setDeptIdByName(dMap);
        const bMap: Record<string, string> = {};
        lookup.branches.forEach((b) => {
          const short = b.name.split(' - ')[0].toLowerCase();
          bMap[short] = b.id;
          bMap[b.name.toLowerCase()] = b.id;
        });
        setBranchIdByName(bMap);
        await refreshAll();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load recruitment data');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshAll]);

  const loadHistory = useCallback(async (candidateId: string) => {
    const items = await getCandidateHistory(candidateId);
    setCandidates((prev) => prev.map((c) => (c.id === candidateId ? { ...c, history: items } : c)));
    return items;
  }, []);

  const pushHistory = useCallback(
    async (id: string, action: string, note?: string) => {
      await addCandidateHistory(id, action, note);
      await loadHistory(id);
    },
    [loadHistory],
  );

  const moveStage = useCallback(
    async (id: string, stage: Candidate['stage'], note?: string) => {
      await updateCandidateStage(id, stage);
      await addCandidateHistory(id, stage, note || `Moved to ${stage}`);
      setCandidates((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)));
      await loadHistory(id);
    },
    [loadHistory],
  );

  const openNewJob = () =>
    setJobModal({ title: '', department: '', branch: '', vacancies: '1', requirements: '', description: '', closingDate: '', status: 'Open' });

  const openEditJob = (job: Job) => {
    const [desc, req] = job.description.split('\nRequirements:');
    setJobModal({ id: job.id, title: job.title, department: job.department, branch: job.branch, vacancies: String(job.vacancies), requirements: req?.trim() || '', description: desc?.trim() || '', closingDate: job.closingDate, status: job.status });
  };

  const closeJob = async (id: string) => {
    await updateJob(id, { status: 'Closed' } as any);
    await refreshJobs();
  };
  const reopenJob = async (id: string) => {
    await updateJob(id, { status: 'Open' } as any);
    await refreshJobs();
  };
  const deleteJobById = async (id: string) => {
    await deleteJob(id);
    await refreshAll();
  };

  // ---- jobs ----
  const saveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobModal) return;
    if (!jobModal.title.trim() || !jobModal.department || !jobModal.branch) return;
    const departmentId = deptIdByName[jobModal.department.toLowerCase()];
    const branchId = branchIdByName[jobModal.branch.toLowerCase()];
    if (!departmentId || !branchId) {
      setError('Department or branch not found. Refresh and try again.');
      return;
    }
    const base = {
      title: jobModal.title.trim(),
      departmentId,
      branchId,
      vacancies: Math.max(1, Number(jobModal.vacancies) || 1),
      description: `${jobModal.description.trim()}${jobModal.requirements.trim() ? `\nRequirements: ${jobModal.requirements.trim()}` : ''}`,
      closingDate: jobModal.closingDate || today(),
      status: jobModal.status,
      postedDate: today(),
    };
    if (jobModal.id) {
      await updateJob(jobModal.id, base);
    } else {
      await createJob(base);
    }
    await refreshJobs();
    setJobModal(null);
    setSuccess(jobModal.id ? 'Vacancy updated.' : 'Vacancy created.');
  };

  // ---- candidate ----
  const addCandidate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    const cv = fd.get('cv');
    if (!v.jobId || !v.name?.trim()) return;
    const job = jobs.find((j) => j.id === v.jobId);
    await createCandidate({
      name: v.name.trim(),
      email: v.email,
      phone: v.phone,
      jobId: v.jobId,
      stage: (v.stage as Candidate['stage']) || 'Applied',
      appliedDate: today(),
      resume: cv instanceof File && cv.name ? cv.name : undefined,
      notes: v.notes,
      rating: v.rating ? Number(v.rating) : undefined,
      source: v.source || 'Other',
    });
    const created = (await getCandidates()).find(
      (c: any) => c.email === v.email && c.jobId === v.jobId,
    ) as any;
    if (created) {
      await addCandidateHistory(created.id, 'Applied', `Noted for ${job?.title || ''} via ${v.source || 'Other'}`);
    }
    await refreshCandidates();
    form.reset();
    setCandModal(false);
    setActiveTab('candidates');
    setSuccess('Candidate added.');
  };

  const openDetail = async (cand: CandidateExt) => {
    setDetail(candidates.find((c) => c.id === cand.id) || null);
    setNoteText('');
    const items = await loadHistory(cand.id);
    setDetail((prev) => (prev && prev.id === cand.id ? { ...prev, history: items } : prev));
  };

  const addDetailNote = async () => {
    if (!noteText.trim() || !detail) return;
    await pushHistory(detail.id, 'Note', noteText.trim());
    const items = await loadHistory(detail.id);
    setDetail({ ...detail, history: items });
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
    const interviewerName = emp ? `${emp.firstName} ${emp.lastName}` : intModal.interviewer;
    await scheduleInterviewAction({
      candidateId: intModal.candidateId,
      date: intModal.date,
      time: intModal.time || '10:00',
      mode: intModal.mode,
      interviewer: interviewerName,
      interviewerId: emp?.id,
      round: intModal.round || 'Round 1',
    });
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
    await refreshInterviews();
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
    await saveOffer({
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

  const changeOfferStatus = async (o: Offer, status: Offer['status']) => {
    const target = offers.find((x) => x.id === o.id) || o;
    await updateOfferStatusAction(target.id, status);
    setOffers((p) => p.map((x) => (x.id === target.id ? { ...x, status } : x)));
    const cand = candidates.find((c) => c.id === target.candidateId);
    if (!cand) return;
    if (status === 'Accepted') await moveStage(cand.id, 'Hired', 'Offer accepted');
    if (status === 'Rejected') await moveStage(cand.id, 'Rejected', 'Offer rejected');
  };

  const convertToEmployee = async () => {
    if (!convertModal) return;
    const cand = candidates.find((c) => c.id === convertModal.candidateId);
    if (!cand) return;
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
    setConvertModal(null);
    setSuccess(`${cand.name} converted to employee.`);
  };

  const cancelInterview = async (id: string) => {
    await updateInterview(id, { status: 'Cancelled' });
    await refreshInterviews();
  };

  const deleteCandidateById = async (id: string) => {
    await deleteCandidate(id);
    await refreshAll();
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
    jobModal, setJobModal, candModal, setCandModal,
    detail, setDetail, noteText, setNoteText,
    intModal, setIntModal, fbModal, setFbModal,
    offerModal, setOfferModal, offerView, setOfferView,
    convertModal, setConvertModal,
    confirmDeleteJob, setConfirmDeleteJob,
    confirmCancelInterview, setConfirmCancelInterview,
    pipeFilter, setPipeFilter,
    pushHistory, moveStage,
    openNewJob, openEditJob, closeJob, reopenJob, deleteJob: deleteJobById, saveJob,
    addCandidate, openDetail, addDetailNote, deleteCandidate: deleteCandidateById,
    openInterviewFor, openOfferFor, openConvertFor, openFeedbackFor,
    scheduleInterview, saveFeedback, saveOffer: saveOfferFor, changeOfferStatus,
    convertToEmployee, cancelInterview,
    analytics, tabs,
  };
}

export type UseRecruitmentReturn = ReturnType<typeof useRecruitment>;
