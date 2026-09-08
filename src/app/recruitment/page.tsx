'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import StatCard from '../../components/ui/StatCard';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import { Briefcase, Users, UserCheck, Plus, Star } from 'lucide-react';
import { mockJobs, mockCandidates } from '../../lib/mock-data';

export default function RecruitmentPage() {
  const [activeTab, setActiveTab] = useState('jobs');

  const tabs = [
    { id: 'jobs', label: 'Job Openings', count: mockJobs.filter(j => j.status === 'Open').length },
    { id: 'candidates', label: 'Candidates', count: mockCandidates.length },
    { id: 'pipeline', label: 'Pipeline' },
  ];

  const stageBadge = (stage: string) => {
    const map: Record<string, 'info' | 'warning' | 'success' | 'danger' | 'neutral'> = {
      Applied: 'info', Screening: 'warning', Interview: 'warning', Selected: 'success', Rejected: 'danger', Offer: 'success', Hired: 'success',
    };
    return <Badge variant={map[stage] || 'neutral'}>{stage}</Badge>;
  };

  const pipelineStages = ['Applied', 'Screening', 'Interview', 'Selected', 'Offer', 'Hired', 'Rejected'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#17324D]">Recruitment</h1>
          <Button variant="primary"><Plus size={16} /> Post Job</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Open Positions" value={mockJobs.filter(j => j.status === 'Open').length} icon={<Briefcase size={22} className="text-[#0F8B8D]" />} iconBg="bg-[#EAF2F4]" />
          <StatCard title="Total Candidates" value={mockCandidates.length} icon={<Users size={22} className="text-blue-600" />} iconBg="bg-blue-50" />
          <StatCard title="Hired This Month" value={mockCandidates.filter(c => c.stage === 'Hired').length} icon={<UserCheck size={22} className="text-green-600" />} iconBg="bg-green-50" />
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
                {mockCandidates.map(cand => (
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
                  const count = mockCandidates.filter(c => c.stage === stage).length;
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
      </div>
    </DashboardLayout>
  );
}
