'use client';

import React, { useState } from 'react';
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
import { Briefcase, Users, UserCheck, UserPlus, Star, Upload } from 'lucide-react';
import { mockJobs, mockCandidates } from '../../lib/mock-data';
import { Candidate } from '../../lib/types';

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [candidates, setCandidates] = useState(mockCandidates);

  const tabs = [
    { id: 'jobs', label: 'Job Openings', count: mockJobs.filter(j => j.status === 'Open').length },
    { id: 'candidates', label: 'Candidates', count: candidates.length },
    { id: 'pipeline', label: 'Application Status' },
  ];

  const stageBadge = (stage: string) => {
    const map: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
      Applied: 'info', Screening: 'warning', Interview: 'warning', Selected: 'success', Rejected: 'danger', Offer: 'success', Hired: 'success',
    };
    return <Badge variant={map[stage] || 'neutral'}>{stage}</Badge>;
  };

  const pipelineStages = ['Applied', 'Screening', 'Interview', 'Selected', 'Offer', 'Hired', 'Rejected'];

  const handleAddCandidate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries()) as Record<string, string>;
    const cv = formData.get('cv');
    const job = mockJobs.find(item => item.id === values.jobId);

    const candidate: Candidate = {
      id: `candidate-${Date.now()}`,
      name: values.name,
      email: values.email,
      phone: values.phone,
      jobId: values.jobId,
      jobTitle: job?.title || '',
      stage: values.stage as Candidate['stage'],
      appliedDate: new Date().toISOString().slice(0, 10),
      resume: cv instanceof File ? cv.name : undefined,
      notes: values.notes,
      rating: values.rating ? Number(values.rating) : undefined,
    };

    setCandidates(current => [candidate, ...current]);
    setActiveTab('candidates');
    setIsAddCandidateOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Talent Acquisition"
          title="Recruitment"
          subtitle="Track job openings and candidates through the hiring pipeline"
          actions={
            <Button variant="primary" onClick={() => setIsAddCandidateOpen(true)}><UserPlus size={16} /> Add Candidate</Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Open Positions" value={mockJobs.filter(j => j.status === 'Open').length} icon={<Briefcase size={22} className="text-[#0F8B8D]" />} iconBg="bg-[#EAF2F4]" />
           <StatCard title="Total Candidates" value={candidates.length} icon={<Users size={22} className="text-blue-600" />} iconBg="bg-blue-50" />
           <StatCard title="Hired This Month" value={candidates.filter(c => c.stage === 'Hired').length} icon={<UserCheck size={22} className="text-green-600" />} iconBg="bg-green-50" />
        </div>

        <Card padding="none">
          <div className="px-6 pt-4"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
          <div className="p-6">
            {activeTab === 'jobs' && (
              <div className="space-y-3">
                {mockJobs.map(job => (
                  <div key={job.id} className="p-4 rounded-lg border border-[#D6E4E8] hover:border-[#0F8B8D]/30 hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-[#17324D]">{job.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{job.department} · {job.branch} · {job.vacancies} opening{job.vacancies > 1 ? 's' : ''}</p>
                        <p className="text-xs text-gray-400 mt-1">{job.applicants} applicants · Posted {job.postedDate}</p>
                      </div>
                      <Badge variant={job.status === 'Open' ? 'success' : job.status === 'On Hold' ? 'warning' : 'neutral'}>{job.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'candidates' && (
              <div className="space-y-3">
                {candidates.map(cand => (
                  <div key={cand.id} className="flex items-center justify-between p-4 rounded-lg border border-[#D6E4E8]">
                    <div className="flex items-center gap-3">
                      <Avatar name={cand.name} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-[#263238]">{cand.name}</p>
                        <p className="text-xs text-gray-500">{cand.jobTitle} · Applied {cand.appliedDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {cand.rating && (
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star size={14} fill="currentColor" />
                          <span className="text-xs font-medium">{cand.rating}</span>
                        </div>
                      )}
                      {stageBadge(cand.stage)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'pipeline' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {pipelineStages.map(stage => {
                  const count = candidates.filter(candidate => candidate.stage === stage).length;
                  return (
                    <div key={stage} className="p-3 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8] text-center">
                      <p className="text-2xl font-bold text-[#17324D]">{count}</p>
                      <p className="text-xs text-gray-500 mt-1">{stage}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Modal isOpen={isAddCandidateOpen} onClose={() => setIsAddCandidateOpen(false)} title="Add Candidate" size="lg">
          <form className="space-y-6" onSubmit={handleAddCandidate}>
            <div>
              <h4 className="text-sm font-semibold text-[#17324D] mb-3">Candidate Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="name" label="Full Name" placeholder="Enter candidate name" required />
                <Input name="email" label="Email Address" type="email" placeholder="candidate@email.com" required />
                <Input name="phone" label="Phone Number" type="tel" placeholder="+1 (555) 000-0000" required />
                <Select
                  name="jobId"
                  label="Applied For"
                  options={[{ value: '', label: 'Select Job Opening' }, ...mockJobs.filter(job => job.status === 'Open').map(job => ({ value: job.id, label: job.title }))]}
                  required
                />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-[#17324D] mb-3">Application Details</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  name="stage"
                  label="Pipeline Stage"
                  options={[
                    { value: 'Applied', label: 'Applied' },
                    { value: 'Screening', label: 'Screening' },
                    { value: 'Interview', label: 'Interview' },
                    { value: 'Offer', label: 'Offer' },
                    { value: 'Hired', label: 'Hired' },
                    { value: 'Rejected', label: 'Rejected' },
                  ]}
                  required
                />
                <div className="sm:col-span-2">
                  <label htmlFor="candidate-cv" className="block text-sm font-medium text-[#263238] mb-1.5">Candidate CV</label>
                  <label htmlFor="candidate-cv" className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#B9D0D6] bg-[#F8FBFC] px-4 py-3 hover:border-[#0F8B8D] hover:bg-[#EAF2F4]/50 transition-colors">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EAF2F4] text-[#0F8B8D]"><Upload size={17} /></span>
                    <span>
                      <span className="block text-sm font-medium text-[#263238]">Upload CV</span>
                      <span className="block text-xs text-gray-500 mt-0.5">PDF, DOC or DOCX up to 10 MB</span>
                    </span>
                    <input id="candidate-cv" name="cv" type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="sr-only" />
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="candidate-notes" className="block text-sm font-medium text-[#263238] mb-1.5">Notes</label>
                  <textarea id="candidate-notes" name="notes" rows={4} placeholder="Add interview notes or additional context" className="w-full rounded-lg border border-[#D6E4E8] bg-white px-4 py-2.5 text-sm text-[#263238] placeholder-gray-400 focus:border-[#0F8B8D] focus:ring-2 focus:ring-[#0F8B8D]/20 focus:outline-none transition-colors" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-[#D6E4E8]">
              <Button type="button" variant="outline" onClick={() => setIsAddCandidateOpen(false)}>Cancel</Button>
              <Button type="submit"><UserPlus size={16} /> Save Candidate</Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
