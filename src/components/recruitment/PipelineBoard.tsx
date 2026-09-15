'use client';

import Select from '../ui/Select';
import type { Candidate, Job } from '../../lib/types';
import { STAGES } from './recruitment-utils';
import type { CandidateExt } from './types';

interface PipelineBoardProps {
  candidates: CandidateExt[];
  jobs: Job[];
  filter: string;
  onFilter: (v: string) => void;
  onAdvance: (id: string, stage: Candidate['stage']) => void;
  onReject: (id: string) => void;
}

export default function PipelineBoard({ candidates, jobs, filter, onFilter, onAdvance, onReject }: PipelineBoardProps) {
  return (
    <div className="space-y-4">
      <div className="sm:w-64"><Select label="Filter by job" value={filter} onChange={e => onFilter(e.target.value)} options={[{ value: '', label: 'All jobs' }, ...jobs.map(j => ({ value: j.id, label: j.title }))]} /></div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {STAGES.map(s => {
          const list = candidates.filter(c => c.stage === s && (!filter || c.jobId === filter));
          return (
            <div key={s} className="rounded-xl border border-[#D6E4E8] bg-[#F8FBFC] p-3">
              <div className="text-center mb-2"><p className="text-xl font-bold text-[#17324D]">{list.length}</p><p className="text-xs text-gray-500">{s}</p></div>
              <div className="space-y-2 max-h-[40vh] overflow-auto">
                {list.map(c => (
                  <div key={c.id} className="rounded-lg bg-white border border-[#D6E4E8] p-2">
                    <p className="text-xs font-semibold text-[#263238] truncate">{c.name}</p>
                    <p className="text-[11px] text-gray-500 truncate">{c.jobTitle}</p>
                    <div className="flex gap-1 mt-1.5">
                      {s !== 'Rejected' && s !== 'Hired' && <button title={`Advance from ${s}`} onClick={() => onAdvance(c.id, STAGES[Math.min(STAGES.indexOf(s) + 1, 5)] as Candidate['stage'])} className="flex-1 rounded bg-green-600 px-1.5 py-1 text-[11px] font-semibold text-white hover:bg-green-700 cursor-pointer">Next</button>}
                      {s !== 'Rejected' && s !== 'Hired' && <button title="Reject" onClick={() => onReject(c.id)} className="rounded bg-red-50 px-1.5 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-100 cursor-pointer">X</button>}
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
