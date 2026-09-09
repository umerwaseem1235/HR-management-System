'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import { Briefcase, Calendar, CheckCircle2, Edit, FileText, ImagePlus, Plus, Send, Star, UserCheck, UserPlus, Users, X } from 'lucide-react';
import { mockCandidates, mockJobs } from '../../lib/mock-data';
import { BRANCHES, DEPARTMENTS } from '../../lib/constants';
import { Candidate, Job } from '../../lib/types';

type RecruitmentCandidate = Candidate & {
  source: string;
  history: string[];
  photo?: string;
  interview?: { date: string; time: string; interviewer: string; feedback: string; status: string };
  offer?: { salary: string; startDate: string; expiryDate: string; status: string };
  converted?: boolean;
};

type RecruitmentJob = Job & { requirements: string };

const stages: Candidate['stage'][] = ['Applied', 'Screening', 'Interview', 'Selected', 'Offer', 'Hired', 'Rejected'];
const sources = ['Career Website', 'LinkedIn', 'Employee Referral', 'Recruitment Agency', 'Job Board', 'Other'];

const stageVariant = (stage: string): 'info' | 'warning' | 'success' | 'danger' | 'neutral' => {
  const map: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
    Applied: 'info', Screening: 'warning', Interview: 'warning', Selected: 'success', Offer: 'success', Hired: 'success', Rejected: 'danger',
  };
  return map[stage] || 'neutral';
};

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [isCandidateOpen, setIsCandidateOpen] = useState(false);
  const [isJobOpen, setIsJobOpen] = useState(false);
  const [isInterviewOpen, setIsInterviewOpen] = useState(false);
  const [isOfferOpen, setIsOfferOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<RecruitmentJob | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<RecruitmentCandidate | null>(null);
  const [jobs, setJobs] = useState<RecruitmentJob[]>(mockJobs.map(job => ({ ...job, requirements: job.description })));
  const [candidates, setCandidates] = useState<RecruitmentCandidate[]>(mockCandidates.map(candidate => ({
    ...candidate,
    source: 'Career Website',
    history: [`Applied for ${candidate.jobTitle} on ${candidate.appliedDate}`],
  })));

  const tabs = [
    { id: 'jobs', label: 'Job Openings', count: jobs.filter(job => job.status === 'Open').length },
    { id: 'candidates', label: 'Candidates', count: candidates.length },
    { id: 'pipeline', label: 'Application Status' },
    { id: 'analytics', label: 'Source Analytics' },
  ];

  const updateCandidate = (id: string, update: Partial<RecruitmentCandidate>) => {
    setCandidates(current => current.map(candidate => candidate.id === id ? { ...candidate, ...update } : candidate));
    setSelectedCandidate(current => current?.id === id ? { ...current, ...update } : current);
  };

  const handleCandidateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries()) as Record<string, string>;
    const job = jobs.find(item => item.id === values.jobId);
    const cv = formData.get('cv');
    const photo = formData.get('photo');
    const candidate: RecruitmentCandidate = {
      id: `candidate-${Date.now()}`,
      name: values.name,
      email: values.email,
      phone: values.phone,
      jobId: values.jobId,
      jobTitle: job?.title || '',
      stage: values.stage as Candidate['stage'],
      appliedDate: new Date().toISOString().slice(0, 10),
      resume: cv instanceof File && cv.name ? cv.name : undefined,
      photo: photo instanceof File && photo.size > 0 ? URL.createObjectURL(photo) : undefined,
      notes: values.notes,
      source: values.source,
      history: [`Application created for ${job?.title || 'a vacancy'}`],
    };
    setCandidates(current => [candidate, ...current]);
    setActiveTab('candidates');
    setIsCandidateOpen(false);
  };

  const handleJobSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    const job: RecruitmentJob = {
      id: editingJob?.id || `job-${Date.now()}`,
      title: values.title,
      department: values.department,
      branch: BRANCHES.find(branch => branch.id === values.branch)?.name || values.branch,
      vacancies: Number(values.vacancies),
      applicants: editingJob?.applicants || 0,
      status: values.status as Job['status'],
      postedDate: editingJob?.postedDate || new Date().toISOString().slice(0, 10),
      closingDate: values.closingDate,
      description: values.requirements,
      requirements: values.requirements,
    };
    setJobs(current => editingJob ? current.map(item => item.id === editingJob.id ? job : item) : [job, ...current]);
    setIsJobOpen(false);
    setEditingJob(null);
  };

  const handleStageChange = (candidate: RecruitmentCandidate, stage: Candidate['stage']) => {
    updateCandidate(candidate.id, {
      stage,
      history: [...candidate.history, `Moved from ${candidate.stage} to ${stage}`],
    });
  };

  const handleInterviewSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCandidate) return;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    updateCandidate(selectedCandidate.id, {
      interview: { date: values.date, time: values.time, interviewer: values.interviewer, feedback: values.feedback, status: values.status },
      history: [...selectedCandidate.history, `Interview scheduled with ${values.interviewer} on ${values.date}`],
    });
    setIsInterviewOpen(false);
  };

  const handleOfferSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCandidate) return;
    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>;
    updateCandidate(selectedCandidate.id, {
      offer: { salary: values.salary, startDate: values.startDate, expiryDate: values.expiryDate, status: values.status },
      stage: 'Offer',
      history: [...selectedCandidate.history, `Offer recorded for ${values.startDate}`],
    });
    setIsOfferOpen(false);
  };

  const openJobEditor = (job?: RecruitmentJob) => {
    setEditingJob(job || null);
    setIsJobOpen(true);
  };

  const openCandidate = (candidate: RecruitmentCandidate) => setSelectedCandidate(candidate);

  const sourceCounts = sources.map(source => ({ source, count: candidates.filter(candidate => candidate.source === source).length }));
  const maxSourceCount = Math.max(...sourceCounts.map(item => item.count), 1);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#17324D]">Recruitment</h1>
            <p className="text-sm text-gray-500 mt-1">Manage vacancies, candidates and hiring activity.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => openJobEditor()}><Plus size={16} /> Add Vacancy</Button>
            <Button variant="primary" onClick={() => setIsCandidateOpen(true)}><UserPlus size={16} /> Add Candidate</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Open Positions" value={jobs.filter(job => job.status === 'Open').length} icon={<Briefcase size={22} className="text-[#0F8B8D]" />} iconBg="bg-[#EAF2F4]" />
          <StatCard title="Total Candidates" value={candidates.length} icon={<Users size={22} className="text-blue-600" />} iconBg="bg-blue-50" />
          <StatCard title="Hired This Month" value={candidates.filter(candidate => candidate.stage === 'Hired').length} icon={<UserCheck size={22} className="text-green-600" />} iconBg="bg-green-50" />
        </div>

        <Card padding="none">
          <div className="px-6 pt-4"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
          <div className="p-6">
            {activeTab === 'jobs' && (
              <div className="space-y-3">
                {jobs.map(job => (
                  <div key={job.id} className="p-4 rounded-lg border border-[#D6E4E8] hover:border-[#0F8B8D]/30 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-[#17324D]">{job.title}</h4>
                          <Badge variant={job.status === 'Open' ? 'success' : job.status === 'On Hold' ? 'warning' : 'neutral'}>{job.status}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{job.department} · {job.branch} · {job.vacancies} opening{job.vacancies > 1 ? 's' : ''}</p>
                        <p className="text-xs text-gray-400 mt-1">{job.applicants} applicants · Closing {job.closingDate}</p>
                        <p className="text-sm text-gray-600 mt-3">{job.requirements}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openJobEditor(job)}><Edit size={14} /> Edit Vacancy</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'candidates' && (
              <div className="space-y-3">
                {candidates.map(candidate => (
                  <div key={candidate.id} className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-lg border border-[#D6E4E8]">
                    <button type="button" onClick={() => openCandidate(candidate)} className="flex items-center gap-3 text-left min-w-0">
                      <Avatar name={candidate.name} src={candidate.photo} size="sm" />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[#263238] truncate">{candidate.name}</span>
                        <span className="block text-xs text-gray-500 truncate">{candidate.jobTitle} · {candidate.source}</span>
                      </span>
                    </button>
                    <div className="flex flex-wrap items-center gap-3">
                      <Select value={candidate.stage} onChange={event => handleStageChange(candidate, event.target.value as Candidate['stage'])} options={stages.map(stage => ({ value: stage, label: stage }))} className="py-1.5 text-xs" />
                      {candidate.resume && <span className="inline-flex items-center gap-1 text-xs text-gray-500"><FileText size={13} /> CV attached</span>}
                      {candidate.interview && <Badge variant="info"><Calendar size={12} /> Interview</Badge>}
                      <Button variant="outline" size="sm" onClick={() => openCandidate(candidate)}>View Profile</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'pipeline' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {stages.map(stage => {
                  const count = candidates.filter(candidate => candidate.stage === stage).length;
                  return <div key={stage} className="p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8] text-center"><p className="text-2xl font-bold text-[#17324D]">{count}</p><p className="text-xs text-gray-500 mt-1">{stage}</p></div>;
                })}
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-5">
                <div><h3 className="text-base font-semibold text-[#17324D]">Candidate Sources</h3><p className="text-sm text-gray-500 mt-1">Where your current candidates came from.</p></div>
                {sourceCounts.map(item => (
                  <div key={item.source} className="flex items-center gap-3">
                    <span className="w-36 text-sm text-[#263238] truncate">{item.source}</span>
                    <div className="flex-1 h-7 rounded-full bg-[#EAF2F4] overflow-hidden"><div className="h-full rounded-full bg-[#0F8B8D] flex items-center justify-end px-2" style={{ width: `${Math.max((item.count / maxSourceCount) * 100, item.count ? 12 : 0)}%` }}><span className="text-xs font-semibold text-white">{item.count}</span></div></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Modal isOpen={isJobOpen} onClose={() => { setIsJobOpen(false); setEditingJob(null); }} title={editingJob ? 'Edit Vacancy' : 'Create Vacancy'} size="lg">
          <form className="space-y-5" onSubmit={handleJobSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input name="title" label="Job Title" placeholder="e.g. Senior Frontend Developer" defaultValue={editingJob?.title} required />
              <Select name="department" label="Department" defaultValue={editingJob?.department} options={[{ value: '', label: 'Select Department' }, ...DEPARTMENTS.map(department => ({ value: department, label: department }))]} required />
              <Select name="branch" label="Branch" defaultValue={BRANCHES.find(branch => branch.name === editingJob?.branch)?.id || ''} options={[{ value: '', label: 'Select Branch' }, ...BRANCHES.map(branch => ({ value: branch.id, label: `${branch.name} - ${branch.city}` }))]} required />
              <Input name="vacancies" label="Vacancy Count" type="number" min="1" defaultValue={editingJob?.vacancies || 1} required />
              <Input name="closingDate" label="Closing Date" type="date" defaultValue={editingJob?.closingDate} required />
              <Select name="status" label="Status" defaultValue={editingJob?.status || 'Open'} options={[{ value: 'Open', label: 'Open' }, { value: 'On Hold', label: 'On Hold' }, { value: 'Closed', label: 'Closed' }]} required />
              <div className="sm:col-span-2"><label htmlFor="requirements" className="block text-sm font-medium text-[#263238] mb-1.5">Requirements and Description</label><textarea id="requirements" name="requirements" rows={4} defaultValue={editingJob?.requirements} placeholder="Skills, experience and role requirements" className="w-full rounded-lg border border-[#D6E4E8] px-4 py-2.5 text-sm focus:border-[#0F8B8D] focus:ring-2 focus:ring-[#0F8B8D]/20 focus:outline-none" required /></div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#D6E4E8]"><Button type="button" variant="outline" onClick={() => setIsJobOpen(false)}>Cancel</Button><Button type="submit"><CheckCircle2 size={16} /> Save Vacancy</Button></div>
          </form>
        </Modal>

        <Modal isOpen={isCandidateOpen} onClose={() => setIsCandidateOpen(false)} title="Add Candidate" size="lg">
          <form className="space-y-5" onSubmit={handleCandidateSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input name="name" label="Full Name" placeholder="Candidate name" required /><Input name="email" label="Email" type="email" placeholder="candidate@email.com" required />
              <Input name="phone" label="Phone" type="tel" placeholder="+1 (555) 000-0000" required /><Select name="jobId" label="Applied For" options={[{ value: '', label: 'Select Job Opening' }, ...jobs.filter(job => job.status === 'Open').map(job => ({ value: job.id, label: job.title }))]} required />
              <Select name="source" label="Recruitment Source" options={sources.map(source => ({ value: source, label: source }))} required /><Select name="stage" label="Application Status" options={stages.map(stage => ({ value: stage, label: stage }))} required />
              <div className="sm:col-span-2"><label htmlFor="candidate-photo" className="block text-sm font-medium text-[#263238] mb-1.5">Candidate Photo</label><label htmlFor="candidate-photo" className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#B9D0D6] bg-[#F8FBFC] px-4 py-3 hover:border-[#0F8B8D] transition-colors"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EAF2F4] text-[#0F8B8D]"><ImagePlus size={17} /></span><span><span className="block text-sm font-medium text-[#263238]">Upload candidate photo</span><span className="block text-xs text-gray-500">JPG, PNG or WEBP</span></span><input id="candidate-photo" name="photo" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" /></label></div>
              <div className="sm:col-span-2"><label htmlFor="candidate-cv" className="block text-sm font-medium text-[#263238] mb-1.5">Candidate CV</label><label htmlFor="candidate-cv" className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#B9D0D6] bg-[#F8FBFC] px-4 py-3 hover:border-[#0F8B8D] transition-colors"><FileText size={18} className="text-[#0F8B8D]" /><span><span className="block text-sm font-medium text-[#263238]">Upload CV</span><span className="block text-xs text-gray-500">PDF, DOC or DOCX</span></span><input id="candidate-cv" name="cv" type="file" accept=".pdf,.doc,.docx" className="sr-only" /></label></div>
              <div className="sm:col-span-2"><label htmlFor="candidate-notes" className="block text-sm font-medium text-[#263238] mb-1.5">Candidate Notes</label><textarea id="candidate-notes" name="notes" rows={4} placeholder="Add initial notes" className="w-full rounded-lg border border-[#D6E4E8] px-4 py-2.5 text-sm focus:border-[#0F8B8D] focus:ring-2 focus:ring-[#0F8B8D]/20 focus:outline-none" /></div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-[#D6E4E8]"><Button type="button" variant="outline" onClick={() => setIsCandidateOpen(false)}>Cancel</Button><Button type="submit"><UserPlus size={16} /> Save Candidate</Button></div>
          </form>
        </Modal>

        <Modal isOpen={Boolean(selectedCandidate)} onClose={() => setSelectedCandidate(null)} title="Candidate Profile" size="lg">
          {selectedCandidate && (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4"><div className="flex items-center gap-3"><Avatar name={selectedCandidate.name} src={selectedCandidate.photo} size="lg" /><div><h3 className="text-lg font-semibold text-[#17324D]">{selectedCandidate.name}</h3><p className="text-sm text-gray-500">{selectedCandidate.email} · {selectedCandidate.phone}</p><p className="text-xs text-gray-500 mt-1">{selectedCandidate.jobTitle} · {selectedCandidate.source}</p></div></div><Badge variant={stageVariant(selectedCandidate.stage)}>{selectedCandidate.stage}</Badge></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div className="rounded-lg bg-[#EAF2F4]/50 p-3"><p className="text-xs text-gray-500">CV</p><p className="text-sm font-medium mt-1">{selectedCandidate.resume || 'No CV uploaded'}</p></div><div className="rounded-lg bg-[#EAF2F4]/50 p-3"><p className="text-xs text-gray-500">Application Date</p><p className="text-sm font-medium mt-1">{selectedCandidate.appliedDate}</p></div></div>
              {selectedCandidate.notes && <div><h4 className="text-sm font-semibold text-[#17324D] mb-2">Notes</h4><p className="text-sm text-gray-600 rounded-lg border border-[#D6E4E8] p-3">{selectedCandidate.notes}</p></div>}
              <div><h4 className="text-sm font-semibold text-[#17324D] mb-2">Candidate History</h4><div className="space-y-2">{selectedCandidate.history.map((entry, index) => <div key={`${entry}-${index}`} className="flex gap-2 text-sm text-gray-600"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#0F8B8D] shrink-0" />{entry}</div>)}</div></div>
              {selectedCandidate.interview && <div className="rounded-lg border border-[#D6E4E8] p-3"><h4 className="text-sm font-semibold text-[#17324D]">Interview</h4><p className="text-sm text-gray-600 mt-1">{selectedCandidate.interview.date} at {selectedCandidate.interview.time} · {selectedCandidate.interview.interviewer}</p><p className="text-sm text-gray-600 mt-1">{selectedCandidate.interview.feedback || 'No feedback recorded yet.'}</p></div>}
              {selectedCandidate.offer && <div className="rounded-lg border border-[#D6E4E8] p-3"><h4 className="text-sm font-semibold text-[#17324D]">Offer</h4><p className="text-sm text-gray-600 mt-1">{selectedCandidate.offer.salary} · Start date {selectedCandidate.offer.startDate} · {selectedCandidate.offer.status}</p></div>}
              <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-[#D6E4E8]"><Button variant="outline" size="sm" onClick={() => setIsInterviewOpen(true)}><Calendar size={14} /> Schedule Interview</Button><Button variant="outline" size="sm" onClick={() => setIsOfferOpen(true)}><Send size={14} /> Record Offer</Button>{selectedCandidate.stage === 'Hired' && !selectedCandidate.converted && <Button size="sm" onClick={() => setIsConvertOpen(true)}><UserCheck size={14} /> Convert to Employee</Button>}</div>
            </div>
          )}
        </Modal>

        <Modal isOpen={isInterviewOpen} onClose={() => setIsInterviewOpen(false)} title="Schedule Interview" size="md">
          <form className="space-y-4" onSubmit={handleInterviewSubmit}><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input name="date" label="Interview Date" type="date" required /><Input name="time" label="Interview Time" type="time" required /><Input name="interviewer" label="Interviewer" placeholder="Interviewer name" className="sm:col-span-2" required /><Select name="status" label="Status" options={[{ value: 'Scheduled', label: 'Scheduled' }, { value: 'Completed', label: 'Completed' }, { value: 'Cancelled', label: 'Cancelled' }]} /><div className="sm:col-span-2"><label htmlFor="feedback" className="block text-sm font-medium text-[#263238] mb-1.5">Interviewer Feedback</label><textarea id="feedback" name="feedback" rows={3} placeholder="Add feedback after the interview" className="w-full rounded-lg border border-[#D6E4E8] px-4 py-2.5 text-sm focus:border-[#0F8B8D] focus:outline-none" /></div></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsInterviewOpen(false)}>Cancel</Button><Button type="submit">Save Interview</Button></div></form>
        </Modal>

        <Modal isOpen={isOfferOpen} onClose={() => setIsOfferOpen(false)} title="Record Offer" size="md">
          <form className="space-y-4" onSubmit={handleOfferSubmit}><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input name="salary" label="Offer Salary" placeholder="$85,000" required /><Input name="startDate" label="Start Date" type="date" required /><Input name="expiryDate" label="Offer Expiry Date" type="date" required /><Select name="status" label="Offer Status" options={[{ value: 'Draft', label: 'Draft' }, { value: 'Sent', label: 'Sent' }, { value: 'Accepted', label: 'Accepted' }, { value: 'Declined', label: 'Declined' }]} /></div><p className="text-xs text-gray-500">The offer record will be added to the candidate history.</p><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsOfferOpen(false)}>Cancel</Button><Button type="submit"><Send size={14} /> Save Offer</Button></div></form>
        </Modal>

        <Modal isOpen={isConvertOpen} onClose={() => setIsConvertOpen(false)} title="Convert to Employee" size="sm">
          {selectedCandidate && <div className="space-y-4"><div className="rounded-lg bg-[#EAF2F4] p-4"><p className="text-sm font-semibold text-[#17324D]">{selectedCandidate.name}</p><p className="text-xs text-gray-500 mt-1">{selectedCandidate.email} · {selectedCandidate.jobTitle}</p></div><p className="text-sm text-gray-600">This will prepare an employee profile using the candidate&apos;s recruitment information.</p><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setIsConvertOpen(false)}>Cancel</Button><Button onClick={() => { updateCandidate(selectedCandidate.id, { converted: true, history: [...selectedCandidate.history, 'Converted to employee'] }); setIsConvertOpen(false); }}>Confirm Conversion</Button></div></div>}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
