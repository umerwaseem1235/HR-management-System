'use client';

import { Eye, XCircle } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Select from '../ui/Select';
import EmptyState from '../ui/EmptyState';
import Card from '../ui/Card';
import type { Interview, Offer, CandidateExt } from './types';

interface InterviewSectionProps {
  interviews: Interview[];
  candidates: CandidateExt[];
  onFeedback: (id: string) => void;
  onCancel: (id: string) => void;
}

export function InterviewSection({ interviews, candidates, onFeedback, onCancel }: InterviewSectionProps) {
  return (
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
              <Button variant="outline" size="sm" onClick={() => onFeedback(iv.id)}>Feedback</Button>
              <button title="Cancel interview" onClick={() => onCancel(iv.id)} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"><XCircle size={15} /></button>
            </div>}
          </div>
        );
      })}
      {interviews.length === 0 && <EmptyState title="No interviews" description="Schedule from Candidates tab." />}
    </div>
  );
}

interface OfferSectionProps {
  offers: Offer[];
  candidates: CandidateExt[];
  onViewLetter: (cand: CandidateExt, offer: Offer) => void;
  onStatus: (offerId: string, status: Offer['status']) => void;
}

export function OfferSection({ offers, candidates, onViewLetter, onStatus }: OfferSectionProps) {
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
              <Button variant="outline" size="sm" onClick={() => onViewLetter(cand, o)}><Eye size={14} /> Letter</Button>
              <Select value={o.status} onChange={e => onStatus(o.id, e.target.value as Offer['status'])} options={['Draft', 'Sent', 'Accepted', 'Rejected'].map(s => ({ value: s, label: s }))} />
            </div>
          </div>
        );
      })}
      {offers.length === 0 && <EmptyState title="No offers" description="Record an offer from Candidates tab." />}
    </div>
  );
}

interface AnalyticsViewProps {
  bySource: { s: string; n: number }[];
  byStage: { s: string; n: number }[];
  total: number;
  conv: number;
}

export function AnalyticsView({ bySource, byStage, total, conv }: AnalyticsViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card><h4 className="text-sm font-semibold text-[#17324D] mb-3">Where candidates came from (manual note)</h4>
        <div className="space-y-2">{bySource.map(x => <div key={x.s}><div className="flex justify-between text-xs"><span>{x.s}</span><span className="font-bold">{x.n}</span></div><div className="h-2 rounded-full bg-[#EAF2F4]"><div className="h-full rounded-full bg-[#024fa7]" style={{ width: `${total ? Math.round(x.n / total * 100) : 0}%` }} /></div></div>)}
          {bySource.length === 0 && <p className="text-xs text-gray-400">No data.</p>}</div></Card>
      <Card><h4 className="text-sm font-semibold text-[#17324D] mb-3">Simple status count · {conv}% hired</h4>
        <div className="space-y-2">{byStage.map(x => <div key={x.s}><div className="flex justify-between text-xs"><span>{x.s}</span><span className="font-bold">{x.n}</span></div><div className="h-2 rounded-full bg-[#EAF2F4]"><div className="h-full rounded-full bg-green-600" style={{ width: `${total ? Math.round(x.n / Math.max(1, total) * 100) : 0}%` }} /></div></div>)}</div></Card>
    </div>
  );
}
