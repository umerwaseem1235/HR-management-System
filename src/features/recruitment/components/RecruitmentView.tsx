'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Tabs from '@/components/ui/Tabs';
import Button from '@/components/ui/Button';
import { Briefcase, UserPlus, CheckCircle2 } from 'lucide-react';
import JobList from './JobList';
import CandidatePipeline from './CandidatePipeline';
import JobModal from './JobModal';
import CandidateModal from './CandidateModal';
import { useRecruitment } from '../hooks/useRecruitment';

export default function RecruitmentView() {
  const r = useRecruitment();

  return (
    <div className="space-y-6">
      <PageHeader title="Recruitment"
        actions={<div className="flex gap-2">
          <Button variant="outline" onClick={r.openNewJob}><Briefcase size={16} /> Note Free Position</Button>
          <Button variant="primary" onClick={() => r.setCandModal(true)}><UserPlus size={16} /> Note Candidate</Button>
        </div>} />

      {r.success && <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"><CheckCircle2 size={16} /><span className="flex-1">{r.success}</span><button onClick={() => r.setSuccess('')} className="font-semibold hover:underline cursor-pointer">Dismiss</button></div>}

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <StatCard title="Free Positions" value={r.jobs.filter(j => j.status === 'Open').reduce((s, j) => s + j.vacancies, 0)} iconName="openVacancies" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Candidates Noted" value={r.candidates.length} iconName="totalEmployees" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Reminders Left" value={r.interviews.filter(i => i.status === 'Scheduled').length} iconName="onLeaveToday" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Hired" value={r.analytics.hired} change={`${r.analytics.conv}% hired`} iconName="presentToday" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
      </div>

      <Card padding="none">
        <div className="px-6 pt-4"><Tabs tabs={r.tabs} activeTab={r.activeTab} onChange={r.setActiveTab} /></div>
        <div className="p-6">
          {r.activeTab === 'jobs' && (
            <JobList
              jobs={r.jobs}
              onEdit={r.openEditJob}
              onClose={r.closeJob}
              onReopen={r.reopenJob}
              onDelete={(job) => r.setConfirmDeleteJob(job)}
            />
          )}

          {(r.activeTab === 'candidates' || r.activeTab === 'pipeline' || r.activeTab === 'interviews' || r.activeTab === 'offers' || r.activeTab === 'analytics') && (
            <CandidatePipeline
              panel={r.activeTab as 'candidates' | 'pipeline' | 'interviews' | 'offers' | 'analytics'}
              candidates={r.candidates}
              jobs={r.jobs}
              interviews={r.interviews}
              offers={r.offers}
              analytics={r.analytics}
              pipeFilter={r.pipeFilter}
              onPipeFilterChange={r.setPipeFilter}
              onStageChange={(id, stage) => r.moveStage(id, stage)}
              onViewCandidate={r.openDetail}
              onScheduleInterview={r.openInterviewFor}
              onRecordOffer={r.openOfferFor}
              onConvert={r.openConvertFor}
              onFeedback={r.openFeedbackFor}
              onCancelInterview={(iv) => r.setConfirmCancelInterview(iv)}
              onViewOffer={(cand, offer) => r.setOfferView({ cand, offer })}
              onOfferStatusChange={r.changeOfferStatus}
            />
          )}
        </div>
      </Card>

      <JobModal
        jobModal={r.jobModal}
        onJobModalChange={(patch) => r.setJobModal(prev => prev ? { ...prev, ...patch } : prev)}
        onClose={() => r.setJobModal(null)}
        onSubmit={r.saveJob}
        confirmDeleteJob={r.confirmDeleteJob}
        onCloseDeleteConfirm={() => r.setConfirmDeleteJob(null)}
        onConfirmDelete={(job) => r.deleteJob(job.id)}
      />

      <CandidateModal
        jobs={r.jobs}
        candidates={r.candidates}
        interviews={r.interviews}
        employees={r.employees}
        candModal={r.candModal}
        onCloseCandModal={() => r.setCandModal(false)}
        onAddCandidate={r.addCandidate}
        detail={r.detail}
        onCloseDetail={() => r.setDetail(null)}
        noteText={r.noteText}
        onNoteTextChange={r.setNoteText}
        onAddNote={r.addDetailNote}
        intModal={r.intModal}
        onIntModalChange={(patch) => r.setIntModal(prev => prev ? { ...prev, ...patch } : prev)}
        onCloseIntModal={() => r.setIntModal(null)}
        onScheduleInterview={r.scheduleInterview}
        fbModal={r.fbModal}
        onFbModalChange={(patch) => r.setFbModal(prev => prev ? { ...prev, ...patch } : prev)}
        onCloseFbModal={() => r.setFbModal(null)}
        onSaveFeedback={r.saveFeedback}
        offerModal={r.offerModal}
        onOfferModalChange={(patch) => r.setOfferModal(prev => prev ? { ...prev, ...patch } : prev)}
        onCloseOfferModal={() => r.setOfferModal(null)}
        onSaveOffer={r.saveOffer}
        offerView={r.offerView}
        onCloseOfferView={() => r.setOfferView(null)}
        convertModal={r.convertModal}
        onConvertModalChange={(patch) => r.setConvertModal(prev => prev ? { ...prev, ...patch } : prev)}
        onCloseConvertModal={() => r.setConvertModal(null)}
        onConvertToEmployee={r.convertToEmployee}
        confirmCancelInterview={r.confirmCancelInterview}
        onCloseCancelInterview={() => r.setConfirmCancelInterview(null)}
        onConfirmCancelInterview={r.cancelInterview}
      />
    </div>
  );
}
