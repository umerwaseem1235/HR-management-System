'use client';

import { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import { Briefcase, UserPlus, CheckCircle2 } from 'lucide-react';
import { mockJobs, mockCandidates, mockEmployees } from '../../lib/mock-data';
import { useNotifications } from '../../contexts/NotificationContext';
import type { Candidate, Job } from '../../lib/types';
import { SOURCES, STAGES, today } from '../../components/recruitment/recruitment-utils';
import type { CandidateExt, ConvertModalState, FbModalState, IntModalState, Interview, JobModalState, Offer, OfferModalState } from '../../components/recruitment/types';
import JobList from '../../components/recruitment/JobList';
import CandidateList from '../../components/recruitment/CandidateList';
import PipelineBoard from '../../components/recruitment/PipelineBoard';
import { InterviewSection, OfferSection, AnalyticsView } from '../../components/recruitment/InterviewOfferAnalytics';
import RecruitmentModals from '../../components/recruitment/RecruitmentModals';

export default function RecruitmentPage() {
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
  const [intModal, setIntModal] = useState<IntModalState | null>(null);
  const [fbModal, setFbModal] = useState<FbModalState | null>(null);
  const [offerModal, setOfferModal] = useState<OfferModalState | null>(null);
  const [offerView, setOfferView] = useState<{ cand: CandidateExt; offer: Offer } | null>(null);
  const [convertModal, setConvertModal] = useState<ConvertModalState | null>(null);
  const [pipeFilter, setPipeFilter] = useState('');

  const pushHistory = (id: string, action: string, note?: string) =>
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, history: [...c.history, { date: today(), action, note }] } : c));

  const moveStage = (id: string, stage: Candidate['stage'], note?: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage } : c));
    pushHistory(id, stage, note || `Moved to ${stage}`);
  };

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader title="Recruitment"
          actions={<div className="flex gap-2">
            <Button variant="outline" onClick={() => setJobModal({ title: '', department: '', branch: '', vacancies: '1', requirements: '', description: '', closingDate: '', status: 'Open' })}><Briefcase size={16} /> Note Free Position</Button>
            <Button variant="primary" onClick={() => setCandModal(true)}><UserPlus size={16} /> Note Candidate</Button>
          </div>} />

        {success && <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"><CheckCircle2 size={16} /><span className="flex-1">{success}</span><button onClick={() => setSuccess('')} className="font-semibold hover:underline cursor-pointer">Dismiss</button></div>}

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <StatCard title="Free Positions" value={jobs.filter(j => j.status === 'Open').reduce((s, j) => s + j.vacancies, 0)} iconName="openVacancies" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
          <StatCard title="Candidates Noted" value={candidates.length} iconName="totalEmployees" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
          <StatCard title="Reminders Left" value={interviews.filter(i => i.status === 'Scheduled').length} iconName="onLeaveToday" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
          <StatCard title="Hired" value={analytics.hired} change={`${analytics.conv}% hired`} iconName="presentToday" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        </div>

        <Card padding="none">
          <div className="px-6 pt-4"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
          <div className="p-6">
            {activeTab === 'jobs' && (
              <JobList
                jobs={jobs}
                onEdit={job => {
                  const [desc, req] = job.description.split('\nRequirements:');
                  setJobModal({ id: job.id, title: job.title, department: job.department, branch: job.branch, vacancies: String(job.vacancies), requirements: req?.trim() || '', description: desc?.trim() || '', closingDate: job.closingDate, status: job.status });
                }}
                onToggleStatus={job => setJobs(p => p.map(j => j.id === job.id ? { ...j, status: job.status === 'Open' ? 'Closed' : 'Open' } : j))}
                onDelete={id => { if (window.confirm('Delete this vacancy?')) setJobs(p => p.filter(j => j.id !== id)); }}
              />
            )}

            {activeTab === 'candidates' && (
              <CandidateList
                candidates={candidates}
                jobs={jobs}
                onStage={moveStage}
                onView={c => { setDetail(candidates.find(x => x.id === c.id) || null); setNoteText(''); }}
                onInterview={c => setIntModal({ candidateId: c.id, date: today(), time: '10:00', mode: 'In-person', interviewer: '', round: 'Round 1' })}
                onOffer={c => setOfferModal({ candidateId: c.id, salary: '', joiningDate: today(), notes: '' })}
                onConvert={c => setConvertModal({ candidateId: c.id, code: '', department: jobs.find(j => j.id === c.jobId)?.department || '', designation: '', branch: jobs.find(j => j.id === c.jobId)?.branch || '', joiningDate: today(), salary: '' })}
              />
            )}

            {activeTab === 'pipeline' && (
              <PipelineBoard
                candidates={candidates}
                jobs={jobs}
                filter={pipeFilter}
                onFilter={setPipeFilter}
                onAdvance={moveStage}
                onReject={id => moveStage(id, 'Rejected', 'Rejected from pipeline')}
              />
            )}

            {activeTab === 'interviews' && (
              <InterviewSection
                interviews={interviews}
                candidates={candidates}
                onFeedback={id => setFbModal({ id, feedback: '', rating: '' })}
                onCancel={id => setInterviews(p => p.map(x => x.id === id ? { ...x, status: 'Cancelled' } : x))}
              />
            )}

            {activeTab === 'offers' && (
              <OfferSection
                offers={offers}
                candidates={candidates}
                onViewLetter={(cand, offer) => setOfferView({ cand, offer })}
                onStatus={(offerId, v) => {
                  setOffers(p => p.map(x => x.id === offerId ? { ...x, status: v } : x));
                  const o = offers.find(x => x.id === offerId);
                  if (o) {
                    if (v === 'Accepted') moveStage(o.candidateId, 'Hired', 'Offer accepted');
                    if (v === 'Rejected') moveStage(o.candidateId, 'Rejected', 'Offer rejected');
                  }
                }}
              />
            )}

            {activeTab === 'analytics' && (
              <AnalyticsView bySource={analytics.bySource} byStage={analytics.byStage} total={candidates.length} conv={analytics.conv} />
            )}
          </div>
        </Card>
      </div>

      <RecruitmentModals
        jobs={jobs}
        candidates={candidates}
        jobModal={jobModal}
        candModal={candModal}
        detail={detail}
        interviews={interviews}
        noteText={noteText}
        intModal={intModal}
        fbModal={fbModal}
        offerModal={offerModal}
        offerView={offerView}
        convertModal={convertModal}
        today={today()}
        onJobModal={setJobModal}
        onSaveJob={saveJob}
        onCandModal={setCandModal}
        onAddCandidate={addCandidate}
        onDetail={setDetail}
        onNoteText={setNoteText}
        onAddNote={() => {
          if (!detail || !noteText.trim()) return;
          pushHistory(detail.id, 'Note', noteText.trim());
          setDetail({ ...detail, history: [...detail.history, { date: today(), action: 'Note', note: noteText.trim() }] });
          setNoteText('');
        }}
        onIntModal={setIntModal}
        onSchedule={scheduleInterview}
        onFbModal={setFbModal}
        onSaveFeedback={saveFeedback}
        onOfferModal={setOfferModal}
        onSaveOffer={saveOffer}
        onOfferView={setOfferView}
        onConvertModal={setConvertModal}
        onConvert={convertToEmployee}
      />
    </DashboardLayout>
  );
}
