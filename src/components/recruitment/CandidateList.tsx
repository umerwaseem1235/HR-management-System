'use client';

import { ArrowRight, CalendarDays, Eye, FileText, Star } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Select from '../ui/Select';
import EmptyState from '../ui/EmptyState';
import type { Candidate, Job } from '../../lib/types';
import { STAGES, today } from './recruitment-utils';
import { StageBadge } from './recruitment-utils';
import type { CandidateExt } from './types';

interface CandidateListProps {
  candidates: CandidateExt[];
  jobs: Job[];
  onStage: (id: string, stage: Candidate['stage']) => void;
  onView: (c: CandidateExt) => void;
  onInterview: (c: CandidateExt) => void;
  onOffer: (c: CandidateExt) => void;
  onConvert: (c: CandidateExt) => void;
}

export default function CandidateList({ candidates, jobs, onStage, onView, onInterview, onOffer, onConvert }: CandidateListProps) {
  void jobs;
  void today;
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
              {cand.rating
                ? <span className="inline-flex items-center gap-1 text-yellow-500 text-xs font-semibold"><Star size={13} fill="currentColor" />{cand.rating}</span>
                : <span className="inline-flex items-center gap-1 text-xs font-semibold invisible"><Star size={13} />0</span>}
              <StageBadge stage={cand.stage} />
            </div>
            <Select value={cand.stage} onChange={e => onStage(cand.id, e.target.value as Candidate['stage'])} options={STAGES.map(s => ({ value: s, label: s }))} />
            <div className="flex items-center justify-end gap-2">
              <button title="View profile & history" onClick={() => onView(cand)} className="p-1.5 rounded-lg bg-[#EAF2F4] text-[#0F8B8D] hover:bg-[#D6E4E8] cursor-pointer"><Eye size={15} /></button>
              <button title="Schedule interview" onClick={() => onInterview(cand)} className="p-1.5 rounded-lg bg-orange-50 text-orange-600 hover:bg-orange-100 cursor-pointer"><CalendarDays size={15} /></button>
              <button title="Record offer" onClick={() => onOffer(cand)} className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 cursor-pointer"><FileText size={15} /></button>
              {cand.stage === 'Hired' && (
                <button title="Convert to employee" onClick={() => onConvert(cand)} className="inline-flex items-center gap-1 rounded-lg bg-[#17324D] px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0F8B8D] cursor-pointer"><ArrowRight size={13} /> To Employee</button>
              )}
            </div>
          </div>
        </div>
      ))}
      {candidates.length === 0 && <EmptyState title="No candidates" description="Add your first candidate." />}
    </div>
  );
}
