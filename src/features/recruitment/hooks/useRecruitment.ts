import { useMemo, useState } from 'react';
import { mockJobs, mockCandidates, mockEmployees } from '@/lib/mock-data';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Candidate, Job } from '@/types';
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
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [candidates, setCandidates] = useState<CandidateExt[]>(() =>
    mockCandidates.map(c => ({ ...c, source: c.id === '2' ? 'Referral' : c.id === '3' ? 'Walk-in' : 'Internal', history: [{ date: c.appliedDate, action: 'Applied', note: `Noted for ${c.jobTitle}` }] }))
  );
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
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

  const pushHistory = (id: string, action: string, note?: string) =>
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, history: [...c.history, { date: today(), action, note }] } : c));

  const moveStage = (id: string, stage: Candidate['stage'], note?: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
    pushHistory(id, stage, note || `Moved to ${stage}`);
  };

  const openNewJob = () =>
    setJobModal({ title: '', department: '', branch: '', vacancies: '1', requirements: '', description: '', closingDate: '', status: 'Open' });

  const openEditJob = (job: Job) => {
    const [desc, req] = job.description.split('\nRequirements:');
    setJobModal({ id: job.id, title: job.title, department: job.department, branch: job.branch, vacancies: String(job.vacancies), requirements: req?.trim() || '', description: desc?.trim() || '', closingDate: job.closingDate, status: job.status });
  };

  const closeJob = (id: string) => setJobs(p => p.map(j => j.id === id ? { ...j, status: 'Closed' } : j));
  const reopenJob = (id: string) => setJobs(p => p.map(j => j.id === id ? { ...j, status: 'Open' } : j));
  const deleteJob = (id: string) => setJobs(p => p.filter(j => j.id !== id));

  // ---- jobs ----
  const saveJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobModal) return;
    if (!jobModal.title.trim() || !jobModal.department || !jobModal.branch) return;
    const base = {
      title: jobModal.title.trim(), department: jobModal.department, branch: jobModal.branch,
      vacancies: Math.max(1, Number(jobModal.vacancies) || 1),
      description: `${jobModal.description.trim()}${jobModal.requirements.trim() ? `\nRequirements: ${jobModal.requirements.trim()}` : ''}`,
      closingDate: jobModal.closingDate || today(), status: jobModal.status,
    };
    if (jobModal.id) setJobs(prev => prev.map(j => j.id === jobModal.id ? { ...j, ...base } : j));
    else setJobs(prev => [{ id: `job-${Date.now()}`, applicants: 0, postedDate: today(), ...base }, ...prev]);
    setJobModal(null);
    setSuccess(jobModal.id ? 'Vacancy updated.' : 'Vacancy created.');
  };

  // ---- candidate ----
  const addCandidate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const v = Object.fromEntries(fd.entries()) as Record<string, string>;
    const cv = fd.get('cv');
    const job = jobs.find(j => j.id === v.jobId);
    const cand: CandidateExt = {
      id: `candidate-${Date.now()}`, name: v.name, email: v.email, phone: v.phone,
      jobId: v.jobId, jobTitle: job?.title || '', stage: (v.stage as Candidate['stage']) || 'Applied',
      appliedDate: today(), resume: cv instanceof File && cv.name ? cv.name : undefined,
      notes: v.notes, rating: v.rating ? Number(v.rating) : undefined,
      source: v.source || 'Other', history: [{ date: today(), action: 'Noted', note: `Manually noted for ${job?.title || ''} via ${v.source}` }],
    };
    setCandidates(prev => [cand, ...prev]);
    setJobs(prev => prev.map(j => j.id === v.jobId ? { ...j, applicants: j.applicants + 1 } : j));
    (e.target as HTMLFormElement).reset();
    setCandModal(false);
    setActiveTab('candidates');
    setSuccess('Candidate added.');
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

  const openFeedbackFor = (id: string) => setFbModal({ id, feedback: '', rating: '' });

  const scheduleInterview = () => {
    if (!intModal || !intModal.candidateId || !intModal.date) return;
    if (!intModal.interviewer) return;
    const cand = candidates.find(c => c.id === intModal.candidateId);
    const emp = mockEmployees.find(e => e.id === intModal.interviewer);
    const interviewerName = emp ? `${emp.firstName} ${emp.lastName}` : intModal.interviewer;
    setInterviews(prev => [...prev, {
      id: `int-${Date.now()}`, candidateId: intModal.candidateId, date: intModal.date, time: intModal.time || '10:00',
      mode: intModal.mode, interviewer: interviewerName, interviewerId: emp?.id, round: intModal.round || 'Round 1', status: 'Scheduled',
    }]);
    if (cand) {
      addNotification({
        title: 'Interview Assigned',
        message: `${interviewerName}, you have to take interview of ${cand.name} (${cand.jobTitle}) on ${intModal.date} at ${intModal.time || '10:00'} · ${intModal.mode}.`,
        type: 'info',
        link: '/recruitment',
      });
    }
    if (cand && cand.stage === 'Applied') moveStage(cand.id, 'Screening', 'Auto-moved on interview schedule');
    if (cand && (cand.stage === 'Screening' || cand.stage === 'Applied')) moveStage(cand.id, 'Interview', `Interview scheduled ${intModal.date} · Interviewer: ${interviewerName}`);
    else if (cand) pushHistory(cand.id, 'Interview Scheduled', `${intModal.date} ${intModal.time} · ${intModal.mode} · Interviewer: ${interviewerName}`);
    setIntModal(null);
    setActiveTab('interviews');
    setSuccess(`Interview scheduled. Notification sent to ${interviewerName}.`);
  };

  const saveFeedback = () => {
    if (!fbModal) return;
    setInterviews(prev => prev.map(i => i.id === fbModal.id ? { ...i, status: 'Completed', feedback: fbModal.feedback, rating: Number(fbModal.rating) || undefined } : i));
    const iv = interviews.find(i => i.id === fbModal.id);
    if (iv) {
      pushHistory(iv.candidateId, 'Feedback', fbModal.feedback || `Rated ${fbModal.rating}`);
      setCandidates(prev => prev.map(c => c.id === iv.candidateId && fbModal.rating ? { ...c, rating: Number(fbModal.rating) } : c));
    }
    setFbModal(null);
    setSuccess('Feedback saved.');
  };

  const saveOffer = () => {
    if (!offerModal || !offerModal.candidateId) return;
    const cand = candidates.find(c => c.id === offerModal.candidateId);
    const offer: Offer = {
      id: `offer-${Date.now()}`, candidateId: offerModal.candidateId,
      salary: Math.max(0, Number(offerModal.salary) || 0), joiningDate: offerModal.joiningDate || today(),
      status: 'Sent', notes: offerModal.notes,
    };
    setOffers(prev => { const ex = prev.find(o => o.candidateId === offer.candidateId); return ex ? prev.map(o => o.candidateId === offer.candidateId ? { ...offer, id: o.id } : o) : [...prev, offer]; });
    if (cand) moveStage(cand.id, 'Offer', `Offer $${offer.salary} · joining ${offer.joiningDate}`);
    setOfferModal(null);
    setActiveTab('offers');
    setSuccess('Offer recorded.');
  };

  const changeOfferStatus = (o: Offer, status: Offer['status']) => {
    setOffers(p => p.map(x => x.id === o.id ? { ...x, status } : x));
    const cand = candidates.find(c => c.id === o.candidateId);
    if (!cand) return;
    if (status === 'Accepted') moveStage(cand.id, 'Hired', 'Offer accepted');
    if (status === 'Rejected') moveStage(cand.id, 'Rejected', 'Offer rejected');
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

  const cancelInterview = (id: string) =>
    setInterviews(p => p.map(x => x.id === id ? { ...x, status: 'Cancelled' } : x));

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
    jobModal, setJobModal, candModal, setCandModal,
    detail, setDetail, noteText, setNoteText,
    intModal, setIntModal, fbModal, setFbModal,
    offerModal, setOfferModal, offerView, setOfferView,
    convertModal, setConvertModal,
    confirmDeleteJob, setConfirmDeleteJob,
    confirmCancelInterview, setConfirmCancelInterview,
    pipeFilter, setPipeFilter,
    pushHistory, moveStage,
    openNewJob, openEditJob, closeJob, reopenJob, deleteJob, saveJob,
    addCandidate, openDetail, addDetailNote,
    openInterviewFor, openOfferFor, openConvertFor, openFeedbackFor,
    scheduleInterview, saveFeedback, saveOffer, changeOfferStatus,
    convertToEmployee, cancelInterview,
    analytics, tabs,
  };
}

export type UseRecruitmentReturn = ReturnType<typeof useRecruitment>;
