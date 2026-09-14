'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import { Briefcase, Users, UserCheck, UserPlus, Star, Upload, Pencil, Trash2, Eye, CalendarDays, FileText, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import { mockJobs, mockCandidates, mockEmployees } from '../../lib/mock-data';
import { useNotifications } from '../../contexts/NotificationContext';
import { DEPARTMENTS, BRANCHES, DESIGNATIONS } from '../../lib/constants';
import type { Candidate, Job } from '../../lib/types';

const SOURCES = ['Referral', 'Walk-in', 'Internal', 'Other'];
const STAGES: Candidate['stage'][] = ['Applied', 'Screening', 'Interview', 'Selected', 'Offer', 'Hired', 'Rejected'];
const INTERVIEW_MODES = ['In-person', 'Phone'];

interface HistoryItem { date: string; action: string; note?: string; }
interface Interview { id: string; candidateId: string; date: string; time: string; mode: string; interviewer: string; interviewerId?: string; round: string; status: 'Scheduled' | 'Completed' | 'Cancelled'; feedback?: string; rating?: number; }
interface Offer { id: string; candidateId: string; salary: number; joiningDate: string; status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected'; notes?: string; }

type CandidateExt = Candidate & { source?: string; history: HistoryItem[]; };
const today = () => new Date().toISOString().slice(0, 10);

function stageBadge(stage: string) {
  const map: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
    Applied: 'info', Screening: 'warning', Interview: 'warning', Selected: 'success', Rejected: 'danger', Offer: 'success', Hired: 'success',
  };
  return <Badge variant={map[stage] || 'neutral'}>{stage}</Badge>;
}

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
  const [jobModal, setJobModal] = useState<{ id?: string; title: string; department: string; branch: string; vacancies: string; requirements: string; description: string; closingDate: string; status: Job['status'] } | null>(null);
  const [candModal, setCandModal] = useState(false);
  const [detail, setDetail] = useState<CandidateExt | null>(null);
  const [noteText, setNoteText] = useState('');
  const [intModal, setIntModal] = useState<{ candidateId: string; date: string; time: string; mode: string; interviewer: string; round: string } | null>(null);
  const [fbModal, setFbModal] = useState<{ id: string; feedback: string; rating: string } | null>(null);
  const [offerModal, setOfferModal] = useState<{ candidateId: string; salary: string; joiningDate: string; notes: string } | null>(null);
  const [offerView, setOfferView] = useState<{ cand: CandidateExt; offer: Offer } | null>(null);
  const [convertModal, setConvertModal] = useState<{ candidateId: string; code: string; department: string; designation: string; branch: string; joiningDate: string; salary: string } | null>(null);
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
          <StatCard title="Free Positions" value={jobs.filter(j => j.status === 'Open').reduce((s, j) => s + j.vacancies, 0)} icon={<Briefcase size={22} className="text-[#024fa7]" />} iconBg="bg-[#EAF2F4]" />
          <StatCard title="Candidates Noted" value={candidates.length} icon={<Users size={22} className="text-blue-600" />} iconBg="bg-blue-50" />
          <StatCard title="Reminders Left" value={interviews.filter(i => i.status === 'Scheduled').length} icon={<CalendarDays size={22} className="text-orange-600" />} iconBg="bg-orange-50" />
          <StatCard title="Hired" value={analytics.hired} change={`${analytics.conv}% hired`} icon={<UserCheck size={22} className="text-green-600" />} iconBg="bg-green-50" />
        </div>

        <Card padding="none">
          <div className="px-6 pt-4"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
          <div className="p-6">

            {activeTab === 'jobs' && (
              <div className="space-y-3">
                {jobs.map(job => (
                  <div key={job.id} className="p-4 rounded-lg border border-[#D6E4E8]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-[#17324D]">{job.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{job.department} · {job.branch} · {job.vacancies} opening{job.vacancies > 1 ? 's' : ''}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{job.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{job.applicants} applicants · Closing {job.closingDate}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={job.status === 'Open' ? 'success' : job.status === 'On Hold' ? 'warning' : 'neutral'}>{job.status}</Badge>
                        <div className="flex gap-1.5">
                          <button title="Edit vacancy" onClick={() => { const [desc, req] = job.description.split('\nRequirements:'); setJobModal({ id: job.id, title: job.title, department: job.department, branch: job.branch, vacancies: String(job.vacancies), requirements: req?.trim() || '', description: desc?.trim() || '', closingDate: job.closingDate, status: job.status }); }} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"><Pencil size={15} /></button>
                          {job.status === 'Open'
                            ? <button title="Close vacancy" onClick={() => setJobs(p => p.map(j => j.id === job.id ? { ...j, status: 'Closed' } : j))} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"><XCircle size={15} /></button>
                            : <button title="Reopen vacancy" onClick={() => setJobs(p => p.map(j => j.id === job.id ? { ...j, status: 'Open' } : j))} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 cursor-pointer"><CheckCircle2 size={15} /></button>}
                          <button title="Delete vacancy" onClick={() => { if (window.confirm('Delete this vacancy?')) setJobs(p => p.filter(j => j.id !== job.id)); }} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"><Trash2 size={15} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {jobs.length === 0 && <EmptyState title="No vacancies" description="Create your first vacancy." />}
              </div>
            )}

            {activeTab === 'candidates' && (
              <div className="space-y-3">
                {candidates.map(cand => (
                  <div key={cand.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border border-[#D6E4E8]">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Avatar name={cand.name} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#263238] truncate">{cand.name}</p>
                        <p className="text-xs text-gray-500 truncate">{cand.jobTitle} · {cand.source} · Applied {cand.appliedDate}</p>
                      </div>
                    </div>
                    <div className="w-full sm:w-[300px] shrink-0 space-y-2">
                      <div className="flex items-center justify-end gap-2 min-h-[24px]">
                        {cand.rating
                          ? <span className="inline-flex items-center gap-1 text-yellow-500 text-xs font-semibold"><Star size={13} fill="currentColor" />{cand.rating}</span>
                          : <span className="inline-flex items-center gap-1 text-xs font-semibold invisible"><Star size={13} />0</span>}
                        {stageBadge(cand.stage)}
                      </div>
                      <Select value={cand.stage} onChange={e => moveStage(cand.id, e.target.value as Candidate['stage'])} options={STAGES.map(s => ({ value: s, label: s }))} />
                      <div className="flex items-center justify-end gap-2">
                        <button title="View profile & history" onClick={() => { setDetail(candidates.find(c => c.id === cand.id) || null); setNoteText(''); }} className="p-1.5 rounded-lg bg-[#EAF2F4] text-[#0F8B8D] hover:bg-[#D6E4E8] cursor-pointer"><Eye size={15} /></button>
                        <button title="Schedule interview" onClick={() => setIntModal({ candidateId: cand.id, date: today(), time: '10:00', mode: 'In-person', interviewer: '', round: 'Round 1' })} className="p-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 cursor-pointer"><CalendarDays size={15} /></button>
                        <button title="Record offer" onClick={() => setOfferModal({ candidateId: cand.id, salary: '', joiningDate: today(), notes: '' })} className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"><FileText size={15} /></button>
                        {cand.stage === 'Hired'
                          ? <button title="Convert to employee" onClick={() => setConvertModal({ candidateId: cand.id, code: '', department: jobs.find(j => j.id === cand.jobId)?.department || '', designation: '', branch: jobs.find(j => j.id === cand.jobId)?.branch || '', joiningDate: today(), salary: '' })} className="inline-flex items-center gap-1 rounded-lg bg-[#17324D] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0F8B8D] cursor-pointer"><ArrowRight size={13} /> To Employee</button>
                          : null}
                      </div>
                    </div>
                  </div>
                ))}
                {candidates.length === 0 && <EmptyState title="No candidates" description="Add your first candidate." />}
              </div>
            )}

            {activeTab === 'pipeline' && (
              <div className="space-y-4">
                <div className="sm:w-64"><Select label="Filter by job" value={pipeFilter} onChange={e => setPipeFilter(e.target.value)} options={[{ value: '', label: 'All jobs' }, ...jobs.map(j => ({ value: j.id, label: j.title }))]} /></div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {STAGES.map(s => {
                    const list = candidates.filter(c => c.stage === s && (!pipeFilter || c.jobId === pipeFilter));
                    return (
                      <div key={s} className="rounded-xl border border-[#D6E4E8] bg-[#F8FBFC] p-3">
                        <div className="text-center mb-2"><p className="text-xl font-bold text-[#17324D]">{list.length}</p><p className="text-xs text-gray-500">{s}</p></div>
                        <div className="space-y-2 max-h-[40vh] overflow-auto">
                          {list.map(c => (
                            <div key={c.id} className="rounded-lg bg-white border border-[#D6E4E8] p-2">
                              <p className="text-xs font-semibold text-[#263238] truncate">{c.name}</p>
                              <p className="text-[11px] text-gray-500 truncate">{c.jobTitle}</p>
                              <div className="flex gap-1 mt-1.5">
                                {s !== 'Rejected' && s !== 'Hired' && <button title={`Advance from ${s}`} onClick={() => moveStage(c.id, STAGES[Math.min(STAGES.indexOf(s) + 1, 5)] as Candidate['stage'])} className="flex-1 rounded bg-green-600 px-1.5 py-1 text-[11px] font-semibold text-white hover:bg-green-700 cursor-pointer">Next</button>}
                                {s !== 'Rejected' && s !== 'Hired' && <button title="Reject" onClick={() => moveStage(c.id, 'Rejected', 'Rejected from pipeline')} className="rounded bg-red-50 px-1.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100 cursor-pointer">X</button>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'interviews' && (
              <div className="space-y-3">
                {interviews.map(iv => {
                  const cand = candidates.find(c => c.id === iv.candidateId);
                  return (
                    <div key={iv.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-[#D6E4E8]">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#17324D]">{cand?.name || iv.candidateId} · {iv.round}</p>
                        <p className="text-xs text-gray-500">{iv.date} {iv.time} · {iv.mode} · {iv.interviewer}</p>
                        {iv.feedback && <p className="text-xs text-gray-600 mt-1">Feedback: {iv.feedback} {iv.rating ? `(${iv.rating}/5)` : ''}</p>}
                      </div>
                      <Badge variant={iv.status === 'Scheduled' ? 'warning' : iv.status === 'Completed' ? 'success' : 'neutral'}>{iv.status}</Badge>
                      {iv.status === 'Scheduled' && <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => setFbModal({ id: iv.id, feedback: '', rating: '' })}>Feedback</Button>
                        <button title="Cancel interview" onClick={() => setInterviews(p => p.map(x => x.id === iv.id ? { ...x, status: 'Cancelled' } : x))} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"><XCircle size={15} /></button>
                      </div>}
                    </div>
                  );
                })}
                {interviews.length === 0 && <EmptyState title="No interviews" description="Schedule from Candidates tab." />}
              </div>
            )}

            {activeTab === 'offers' && (
              <div className="space-y-3">
                {offers.map(o => {
                  const cand = candidates.find(c => c.id === o.candidateId);
                  if (!cand) return null;
                  return (
                    <div key={o.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-[#D6E4E8]">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#17324D]">{cand.name} · ${o.salary.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Joining {o.joiningDate} · {o.notes || cand.jobTitle}</p>
                      </div>
                      <Badge variant={o.status === 'Accepted' ? 'success' : o.status === 'Rejected' ? 'danger' : 'info'}>{o.status}</Badge>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" onClick={() => setOfferView({ cand, offer: o })}><Eye size={14} /> Letter</Button>
                        <Select value={o.status} onChange={e => { const v = e.target.value as Offer['status']; setOffers(p => p.map(x => x.id === o.id ? { ...x, status: v } : x)); if (v === 'Accepted') moveStage(cand.id, 'Hired', 'Offer accepted'); if (v === 'Rejected') moveStage(cand.id, 'Rejected', 'Offer rejected'); }} options={['Draft', 'Sent', 'Accepted', 'Rejected'].map(s => ({ value: s, label: s }))} />
                      </div>
                    </div>
                  );
                })}
                {offers.length === 0 && <EmptyState title="No offers" description="Record an offer from Candidates tab." />}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card><h4 className="text-sm font-semibold text-[#17324D] mb-3">Where candidates came from (manual note)</h4>
                  <div className="space-y-2">{analytics.bySource.map(x => <div key={x.s}><div className="flex justify-between text-xs"><span>{x.s}</span><span className="font-bold">{x.n}</span></div><div className="h-2 rounded-full bg-[#EAF2F4]"><div className="h-full rounded-full bg-[#024fa7]" style={{ width: `${candidates.length ? Math.round(x.n / candidates.length * 100) : 0}%` }} /></div></div>)}
                    {analytics.bySource.length === 0 && <p className="text-xs text-gray-400">No data.</p>}</div></Card>
                <Card><h4 className="text-sm font-semibold text-[#17324D] mb-3">Simple status count · {analytics.conv}% hired</h4>
                  <div className="space-y-2">{analytics.byStage.map(x => <div key={x.s}><div className="flex justify-between text-xs"><span>{x.s}</span><span className="font-bold">{x.n}</span></div><div className="h-2 rounded-full bg-[#EAF2F4]"><div className="h-full rounded-full bg-green-600" style={{ width: `${candidates.length ? Math.round(x.n / Math.max(1, candidates.length) * 100) : 0}%` }} /></div></div>)}</div></Card>
              </div>
            )}

          </div>
        </Card>
      </div>

      {/* job modal */}
      <Modal isOpen={!!jobModal} onClose={() => setJobModal(null)} title={jobModal?.id ? 'Edit Free Position Note' : 'Note Free Position (Manual)'} size="lg">
        {jobModal && (
          <form onSubmit={saveJob} className="space-y-4">
            <Input label="Job Title" value={jobModal.title} onChange={e => setJobModal({ ...jobModal, title: e.target.value })} placeholder="e.g. Senior Frontend Developer" required />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select label="Department" value={jobModal.department} onChange={e => setJobModal({ ...jobModal, department: e.target.value })} options={[{ value: '', label: 'Select' }, ...DEPARTMENTS.map(d => ({ value: d, label: d }))]} required />
              <Select label="Branch" value={jobModal.branch} onChange={e => setJobModal({ ...jobModal, branch: e.target.value })} options={[{ value: '', label: 'Select' }, ...BRANCHES.map(b => ({ value: b.name, label: `${b.name} - ${b.city}` }))]} required />
              <Input label="Vacancy Count" type="number" min={1} value={jobModal.vacancies} onChange={e => setJobModal({ ...jobModal, vacancies: e.target.value })} required />
            </div>
            <div><label className="block text-sm font-medium text-[#263238] mb-1.5">Requirements</label>
              <textarea rows={3} value={jobModal.requirements} onChange={e => setJobModal({ ...jobModal, requirements: e.target.value })} placeholder="Skills, experience, education…" className="w-full rounded-lg border border-[#D6E4E8] px-4 py-2.5 text-sm focus:border-[#024fa7] focus:outline-none" /></div>
            <div><label className="block text-sm font-medium text-[#263238] mb-1.5">Job Description</label>
              <textarea rows={3} value={jobModal.description} onChange={e => setJobModal({ ...jobModal, description: e.target.value })} placeholder="Role summary…" className="w-full rounded-lg border border-[#D6E4E8] px-4 py-2.5 text-sm focus:border-[#024fa7] focus:outline-none" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Closing Date" type="date" value={jobModal.closingDate} onChange={e => setJobModal({ ...jobModal, closingDate: e.target.value })} />
              <Select label="Status" value={jobModal.status} onChange={e => setJobModal({ ...jobModal, status: e.target.value as Job['status'] })} options={['Open', 'On Hold', 'Closed'].map(s => ({ value: s, label: s }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-[#D6E4E8]"><Button variant="outline" type="button" onClick={() => setJobModal(null)}>Cancel</Button><Button type="submit"><Briefcase size={16} /> Save Note</Button></div>
          </form>
        )}
      </Modal>

      {/* candidate modal */}
      <Modal isOpen={candModal} onClose={() => setCandModal(false)} title="Note Candidate (Manual, for HR reminder)" size="lg">
        <form onSubmit={addCandidate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input name="name" label="Full Name" required />
            <Input name="email" label="Email" type="email" required />
            <Input name="phone" label="Phone" required />
            <Select name="jobId" label="Applied For" options={[{ value: '', label: 'Select Job' }, ...jobs.filter(j => j.status === 'Open').map(j => ({ value: j.id, label: j.title }))]} required />
            <Select name="stage" label="Stage" options={STAGES.map(s => ({ value: s, label: s }))} required />
            <Select name="source" label="Source" options={SOURCES.map(s => ({ value: s, label: s }))} required />
            <Input name="rating" label="Rating (1-5)" type="number" min={1} max={5} />
            <div className="sm:col-span-2"><label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#B9D0D6] bg-[#F8FBFC] px-4 py-3"><Upload size={17} /><span className="text-sm">Upload CV (PDF/DOC)</span><input name="cv" type="file" accept=".pdf,.doc,.docx" className="sr-only" /></label></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium mb-1.5">Notes</label><textarea name="notes" rows={3} className="w-full rounded-lg border border-[#D6E4E8] px-4 py-2.5 text-sm" /></div>
          </div>
          <div className="flex justify-end gap-3"><Button variant="outline" type="button" onClick={() => setCandModal(false)}>Cancel</Button><Button type="submit"><UserPlus size={16} /> Save</Button></div>
        </form>
      </Modal>

      {/* detail */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Candidate Profile & History" size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Avatar name={detail.name} size="sm" /><div className="flex-1"><p className="font-semibold text-[#17324D]">{detail.name}</p><p className="text-xs text-gray-500">{detail.email} · {detail.phone} · {detail.source}</p></div>{stageBadge(detail.stage)}</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-[#EAF2F4]/60 border p-4 text-sm">
              <div><p className="text-[11px] text-gray-500 uppercase">Job</p><p className="font-semibold">{detail.jobTitle}</p></div>
              <div><p className="text-[11px] text-gray-500 uppercase">CV</p><p className="font-semibold">{detail.resume || '—'}</p></div>
              <div><p className="text-[11px] text-gray-500 uppercase">Rating</p><p className="font-semibold">{detail.rating ?? '—'}</p></div>
              <div><p className="text-[11px] text-gray-500 uppercase">Applied</p><p className="font-semibold">{detail.appliedDate}</p></div>
            </div>
            {detail.notes && <p className="text-sm text-gray-600 rounded-lg border p-3">Notes: {detail.notes}</p>}
            <div><p className="text-sm font-semibold mb-2">Interviews</p>{interviews.filter(i => i.candidateId === detail.id).map(i => <p key={i.id} className="text-xs text-gray-600">{i.date} {i.time} · {i.round} · {i.interviewer} · {i.status}{i.feedback ? ` — ${i.feedback}` : ''}</p>)}{interviews.filter(i => i.candidateId === detail.id).length === 0 && <p className="text-xs text-gray-400">No interviews.</p>}</div>
            <div><p className="text-sm font-semibold mb-2">History</p><div className="space-y-1.5 max-h-40 overflow-auto">{[...detail.history].reverse().map((h, i) => <div key={i} className="flex gap-2 text-xs"><span className="text-gray-400 whitespace-nowrap">{h.date}</span><span className="font-semibold">{h.action}</span><span className="text-gray-500">{h.note || ''}</span></div>)}</div></div>
            <div className="flex gap-2"><Input placeholder="Add a note…" value={noteText} onChange={e => setNoteText(e.target.value)} /><Button variant="outline" size="sm" onClick={() => { if (!noteText.trim()) return; pushHistory(detail.id, 'Note', noteText.trim()); setDetail({ ...detail, history: [...detail.history, { date: today(), action: 'Note', note: noteText.trim() }] }); setNoteText(''); }}>Add</Button></div>
          </div>
        )}
      </Modal>

      {/* interview */}
      <Modal isOpen={!!intModal} onClose={() => setIntModal(null)} title="Schedule Interview" size="sm">
        {intModal && <div className="space-y-4">
          <Select label="Candidate" value={intModal.candidateId} onChange={e => setIntModal({ ...intModal, candidateId: e.target.value })} options={candidates.map(c => ({ value: c.id, label: c.name }))} />
          <div className="grid grid-cols-2 gap-3"><Input label="Date" type="date" value={intModal.date} onChange={e => setIntModal({ ...intModal, date: e.target.value })} /><Input label="Time" type="time" value={intModal.time} onChange={e => setIntModal({ ...intModal, time: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3"><Select label="Mode" value={intModal.mode} onChange={e => setIntModal({ ...intModal, mode: e.target.value })} options={INTERVIEW_MODES.map(m => ({ value: m, label: m }))} /><Input label="Round" value={intModal.round} onChange={e => setIntModal({ ...intModal, round: e.target.value })} /></div>
          <Select label="Interviewer (employee)" value={intModal.interviewer} onChange={e => setIntModal({ ...intModal, interviewer: e.target.value })} options={[{ value: '', label: 'Select employee interviewer…' }, ...mockEmployees.map(e => ({ value: e.id, label: `${e.firstName} ${e.lastName} — ${e.designation}` }))]} />
          <p className="text-xs text-gray-500">Selected employee will get a notification to take this interview.</p>
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setIntModal(null)}>Cancel</Button><Button variant="primary" onClick={scheduleInterview} disabled={!intModal.interviewer || !intModal.date}><CalendarDays size={16} /> Schedule</Button></div>
        </div>}
      </Modal>

      <Modal isOpen={!!fbModal} onClose={() => setFbModal(null)} title="Interviewer Feedback" size="sm">
        {fbModal && <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1.5">Feedback</label><textarea rows={4} value={fbModal.feedback} onChange={e => setFbModal({ ...fbModal, feedback: e.target.value })} className="w-full rounded-lg border border-[#D6E4E8] px-4 py-2.5 text-sm" placeholder="Strengths, gaps, decision…" /></div>
          <Input label="Rating (1-5)" type="number" min={1} max={5} value={fbModal.rating} onChange={e => setFbModal({ ...fbModal, rating: e.target.value })} />
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setFbModal(null)}>Cancel</Button><Button variant="primary" onClick={saveFeedback}>Save</Button></div>
        </div>}
      </Modal>

      {/* offer */}
      <Modal isOpen={!!offerModal} onClose={() => setOfferModal(null)} title="Record Offer" size="sm">
        {offerModal && <div className="space-y-4">
          <Input label="Salary ($/year)" type="number" value={offerModal.salary} onChange={e => setOfferModal({ ...offerModal, salary: e.target.value })} />
          <Input label="Joining Date" type="date" value={offerModal.joiningDate} onChange={e => setOfferModal({ ...offerModal, joiningDate: e.target.value })} />
          <Input label="Notes" value={offerModal.notes} onChange={e => setOfferModal({ ...offerModal, notes: e.target.value })} />
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setOfferModal(null)}>Cancel</Button><Button variant="primary" onClick={saveOffer}><FileText size={16} /> Save Offer</Button></div>
        </div>}
      </Modal>

      <Modal isOpen={!!offerView} onClose={() => setOfferView(null)} title="Offer Letter" size="lg">
        {offerView && <div className="space-y-4">
          <div className="rounded-xl border p-6 text-sm leading-6">
            <p className="font-bold text-lg">Offer Letter — CodeQor</p>
            <p className="mt-2">Date: {today()}</p>
            <p>Candidate: {offerView.cand.name} ({offerView.cand.email})</p>
            <p>Position: {offerView.cand.jobTitle}</p>
            <p>Salary: ${offerView.offer.salary.toLocaleString()}/year</p>
            <p>Joining: {offerView.offer.joiningDate}</p>
            <p className="mt-3">We are pleased to offer you the above position. Please confirm acceptance.</p>
            <p className="mt-4">HR, CodeQor</p>
          </div>
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setOfferView(null)}>Close</Button></div>
        </div>}
      </Modal>

      {/* convert */}
      <Modal isOpen={!!convertModal} onClose={() => setConvertModal(null)} title="Convert to Employee" size="sm">
        {convertModal && <div className="space-y-4">
          <Input label="Employee Code" value={convertModal.code} onChange={e => setConvertModal({ ...convertModal, code: e.target.value })} placeholder="e.g. CQ-016" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Department" value={convertModal.department} onChange={e => setConvertModal({ ...convertModal, department: e.target.value })} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
            <Select label="Designation" value={convertModal.designation} onChange={e => setConvertModal({ ...convertModal, designation: e.target.value })} options={DESIGNATIONS.map(d => ({ value: d, label: d }))} />
          </div>
          <Select label="Branch" value={convertModal.branch} onChange={e => setConvertModal({ ...convertModal, branch: e.target.value })} options={BRANCHES.map(b => ({ value: b.name, label: b.name }))} />
          <div className="grid grid-cols-2 gap-3"><Input label="Joining Date" type="date" value={convertModal.joiningDate} onChange={e => setConvertModal({ ...convertModal, joiningDate: e.target.value })} /><Input label="Salary" type="number" value={convertModal.salary} onChange={e => setConvertModal({ ...convertModal, salary: e.target.value })} /></div>
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => setConvertModal(null)}>Cancel</Button><Button variant="primary" onClick={convertToEmployee}><ArrowRight size={16} /> Convert</Button></div>
        </div>}
      </Modal>

    </DashboardLayout>
  );
}
