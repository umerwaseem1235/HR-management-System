'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/shared';
import { Eye, Pencil, Trash2, Download, CalendarDays, FileText, ArrowRight, XCircle } from 'lucide-react';
import type { Candidate, Job } from '@/types';
import { CandidateExt, Interview, Offer, STAGES, cvDisplayName } from '../types';

interface CandidatePipelineProps {
  panel: 'candidates' | 'pipeline' | 'interviews' | 'offers' | 'analytics';
  candidates: CandidateExt[];
  jobs: Job[];
  interviews: Interview[];
  offers: Offer[];
  analytics: { bySource: { s: string; n: number }[]; byStage: { s: string; n: number }[]; hired: number; conv: number };
  pipeFilter: string;
  onPipeFilterChange: (value: string) => void;
  onStageChange: (id: string, stage: Candidate['stage']) => void;
  onViewCandidate: (cand: CandidateExt) => void;
  onEditCandidate: (cand: CandidateExt) => void;
  onDeleteCandidate: (cand: CandidateExt) => void;
  onDownloadResume: (path?: string | null) => void;
  onScheduleInterview: (candidateId: string) => void;
  onRecordOffer: (candidateId: string) => void;
  onConvert: (cand: CandidateExt) => void;
  onCancelInterview: (iv: Interview) => void;
  onViewOffer: (cand: CandidateExt, offer: Offer) => void;
  onOfferStatusChange: (offer: Offer, status: Offer['status']) => void;
}

export default function CandidatePipeline(props: CandidatePipelineProps) {
  const {
    panel, candidates, jobs, interviews, offers, analytics,
    pipeFilter, onPipeFilterChange, onStageChange,
    onViewCandidate, onEditCandidate, onDeleteCandidate, onDownloadResume, onScheduleInterview, onRecordOffer, onConvert,
    onCancelInterview, onViewOffer, onOfferStatusChange,
  } = props;

  if (panel === 'candidates') {
    return (
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
                <StatusBadge status={cand.stage} />
              </div>
              <Select value={cand.stage} onChange={e => onStageChange(cand.id, e.target.value as Candidate['stage'])} options={STAGES.map(s => ({ value: s, label: s }))} />
              <div className="flex items-center justify-end gap-2">
                <button title="View profile & history" onClick={() => onViewCandidate(cand)} className="p-1.5 rounded-lg bg-[#EAF2F4] text-[#0F8B8D] hover:bg-[#D6E4E8] cursor-pointer"><Eye size={15} /></button>
                {cand.resume
                  ? <button title={`Download CV (${cvDisplayName(cand.resume)})`} onClick={() => onDownloadResume(cand.resume)} className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 cursor-pointer"><Download size={15} /></button>
                  : null}
                <button title="Edit candidate" onClick={() => onEditCandidate(cand)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"><Pencil size={15} /></button>
                <button title="Schedule interview" onClick={() => onScheduleInterview(cand.id)} className="p-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 cursor-pointer"><CalendarDays size={15} /></button>
                <button title="Record offer" onClick={() => onRecordOffer(cand.id)} className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"><FileText size={15} /></button>
                <button title="Delete candidate" onClick={() => onDeleteCandidate(cand)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"><Trash2 size={15} /></button>
                {cand.stage === 'Hired'
                  ? <button title="Convert to employee" onClick={() => onConvert(cand)} className="inline-flex items-center gap-1 rounded-lg bg-[#17324D] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0F8B8D] cursor-pointer"><ArrowRight size={13} /> To Employee</button>
                  : null}
              </div>
            </div>
          </div>
        ))}
        {candidates.length === 0 && <EmptyState title="No candidates" description="Add your first candidate." />}
      </div>
    );
  }

  if (panel === 'pipeline') {
    return (
      <div className="space-y-4">
        <div className="sm:w-64"><Select label="Filter by job" value={pipeFilter} onChange={e => onPipeFilterChange(e.target.value)} options={[{ value: '', label: 'All jobs' }, ...jobs.map(j => ({ value: j.id, label: j.title }))]} /></div>
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
                        {s !== 'Rejected' && s !== 'Hired' && <button title={`Advance from ${s}`} onClick={() => onStageChange(c.id, STAGES[Math.min(STAGES.indexOf(s) + 1, 5)] as Candidate['stage'])} className="flex-1 rounded bg-green-600 px-1.5 py-1 text-[11px] font-semibold text-white hover:bg-green-700 cursor-pointer">Next</button>}
                        {s !== 'Rejected' && s !== 'Hired' && <button title="Reject" onClick={() => onStageChange(c.id, 'Rejected')} className="rounded bg-red-50 px-1.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100 cursor-pointer">X</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (panel === 'interviews') {
    return (
      <div className="space-y-3">
        {interviews.map(iv => {
          const cand = candidates.find(c => c.id === iv.candidateId);
          return (
            <div key={iv.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-[#D6E4E8]">
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#17324D]">{cand?.name || iv.candidateId} · {iv.round}</p>
                <p className="text-xs text-gray-500">{iv.date} {iv.time} · {iv.mode} · {iv.interviewer}</p>
              </div>
              <Badge variant={iv.status === 'Scheduled' ? 'warning' : iv.status === 'Completed' ? 'success' : 'neutral'}>{iv.status}</Badge>
              {iv.status === 'Scheduled' && <div className="flex gap-1.5">
                <button title="Cancel interview" onClick={() => onCancelInterview(iv)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"><XCircle size={15} /></button>
              </div>}
            </div>
          );
        })}
        {interviews.length === 0 && <EmptyState title="No interviews" description="Schedule from Candidates tab." />}
      </div>
    );
  }

  if (panel === 'offers') {
    return (
      <div className="space-y-3">
        {offers.map(o => {
          const cand = candidates.find(c => c.id === o.candidateId);
          if (!cand) return null;
          return (
            <div key={o.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-[#D6E4E8]">
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#17324D]">{cand.name} · PKR {o.salary.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Joining {o.joiningDate} · {o.notes || cand.jobTitle}</p>
              </div>
              <Badge variant={o.status === 'Accepted' ? 'success' : o.status === 'Rejected' ? 'danger' : 'info'}>{o.status}</Badge>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => onViewOffer(cand, o)}><Eye size={14} /> Letter</Button>
                <Select value={o.status} onChange={e => onOfferStatusChange(o, e.target.value as Offer['status'])} options={['Draft', 'Sent', 'Accepted', 'Rejected'].map(s => ({ value: s, label: s }))} />
              </div>
            </div>
          );
        })}
        {offers.length === 0 && <EmptyState title="No offers" description="Record an offer from Candidates tab." />}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card><h4 className="text-sm font-semibold text-[#17324D] mb-3">Where candidates came from (manual note)</h4>
        <div className="space-y-2">{analytics.bySource.map(x => <div key={x.s}><div className="flex justify-between text-xs"><span>{x.s}</span><span className="font-bold">{x.n}</span></div><div className="h-2 rounded-full bg-[#EAF2F4]"><div className="h-full rounded-full bg-[#024fa7]" style={{ width: `${candidates.length ? Math.round(x.n / candidates.length * 100) : 0}%` }} /></div></div>)}
          {analytics.bySource.length === 0 && <p className="text-xs text-gray-400">No data.</p>}</div></Card>
      <Card><h4 className="text-sm font-semibold text-[#17324D] mb-3">Simple status count · {analytics.conv}% hired</h4>
        <div className="space-y-2">{analytics.byStage.map(x => <div key={x.s}><div className="flex justify-between text-xs"><span>{x.s}</span><span className="font-bold">{x.n}</span></div><div className="h-2 rounded-full bg-[#EAF2F4]"><div className="h-full rounded-full bg-green-600" style={{ width: `${candidates.length ? Math.round(x.n / Math.max(1, candidates.length) * 100) : 0}%` }} /></div></div>)}</div></Card>
    </div>
  );
}
