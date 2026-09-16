'use client';

import { ArrowRight, Briefcase, CalendarDays, FileText, Upload, UserPlus } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Avatar from '../ui/Avatar';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { mockEmployees } from '../../lib/mock-data';
import { DEPARTMENTS, BRANCHES, DESIGNATIONS } from '../../lib/constants';
import { INTERVIEW_MODES, SOURCES, STAGES, StageBadge } from './recruitment-utils';
import type { CandidateExt, ConvertModalState, FbModalState, IntModalState, Interview, JobModalState, Offer, OfferModalState } from './types';

interface RecruitmentModalsProps {
  jobs: { id: string; title: string; status: string }[];
  candidates: CandidateExt[];
  jobModal: JobModalState | null;
  candModal: boolean;
  detail: CandidateExt | null;
  interviews: Interview[];
  noteText: string;
  intModal: IntModalState | null;
  fbModal: FbModalState | null;
  offerModal: OfferModalState | null;
  offerView: { cand: CandidateExt; offer: Offer } | null;
  convertModal: ConvertModalState | null;
  today: string;
  onJobModal: (v: JobModalState | null) => void;
  onSaveJob: (e: React.FormEvent) => void;
  onCandModal: (v: boolean) => void;
  onAddCandidate: (e: React.FormEvent<HTMLFormElement>) => void;
  onDetail: (v: CandidateExt | null) => void;
  onNoteText: (v: string) => void;
  onAddNote: () => void;
  onIntModal: (v: IntModalState | null) => void;
  onSchedule: () => void;
  onFbModal: (v: FbModalState | null) => void;
  onSaveFeedback: () => void;
  onOfferModal: (v: OfferModalState | null) => void;
  onSaveOffer: () => void;
  onOfferView: (v: { cand: CandidateExt; offer: Offer } | null) => void;
  onConvertModal: (v: ConvertModalState | null) => void;
  onConvert: () => void;
}

export default function RecruitmentModals(p: RecruitmentModalsProps) {
  const { jobModal, candModal, detail, interviews, noteText, intModal, fbModal, offerModal, offerView, convertModal, today } = p;
  return (
    <>
      <Modal isOpen={!!jobModal} onClose={() => p.onJobModal(null)} title={jobModal?.id ? 'Edit Free Position Note' : 'Note Free Position (Manual)'} size="lg">
        {jobModal && (
          <form onSubmit={p.onSaveJob} className="space-y-4">
            <Input label="Job Title" value={jobModal.title} onChange={e => p.onJobModal({ ...jobModal, title: e.target.value })} placeholder="e.g. Senior Frontend Developer" required />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select label="Department" value={jobModal.department} onChange={e => p.onJobModal({ ...jobModal, department: e.target.value })} options={[{ value: '', label: 'Select' }, ...DEPARTMENTS.map(d => ({ value: d, label: d }))]} required />
              <Select label="Branch" value={jobModal.branch} onChange={e => p.onJobModal({ ...jobModal, branch: e.target.value })} options={[{ value: '', label: 'Select' }, ...BRANCHES.map(b => ({ value: b.name, label: `${b.name} - ${b.city}` }))]} required />
              <Input label="Vacancy Count" type="number" min={1} value={jobModal.vacancies} onChange={e => p.onJobModal({ ...jobModal, vacancies: e.target.value })} required />
            </div>
            <div><label className="block text-sm font-medium text-[#263238] mb-1.5">Requirements</label>
              <textarea rows={3} value={jobModal.requirements} onChange={e => p.onJobModal({ ...jobModal, requirements: e.target.value })} placeholder="Skills, experience, education…" className="w-full rounded-lg border border-[#D6E4E8] px-4 py-2.5 text-sm focus:border-[#024fa7] focus:outline-none" /></div>
            <div><label className="block text-sm font-medium text-[#263238] mb-1.5">Job Description</label>
              <textarea rows={3} value={jobModal.description} onChange={e => p.onJobModal({ ...jobModal, description: e.target.value })} placeholder="Role summary…" className="w-full rounded-lg border border-[#D6E4E8] px-4 py-2.5 text-sm focus:border-[#024fa7] focus:outline-none" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Closing Date" type="date" value={jobModal.closingDate} onChange={e => p.onJobModal({ ...jobModal, closingDate: e.target.value })} />
              <Select label="Status" value={jobModal.status} onChange={e => p.onJobModal({ ...jobModal, status: e.target.value as JobModalState['status'] })} options={['Open', 'On Hold', 'Closed'].map(s => ({ value: s, label: s }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-[#D6E4E8]"><Button variant="outline" type="button" onClick={() => p.onJobModal(null)}>Cancel</Button><Button type="submit"><Briefcase size={16} /> Save Note</Button></div>
          </form>
        )}
      </Modal>

      <Modal isOpen={candModal} onClose={() => p.onCandModal(false)} title="Note Candidate (Manual, for HR reminder)" size="lg">
        <form onSubmit={p.onAddCandidate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input name="name" label="Full Name" required />
            <Input name="email" label="Email" type="email" required />
            <Input name="phone" label="Phone" required />
            <Select name="jobId" label="Applied For" options={[{ value: '', label: 'Select Job' }, ...p.jobs.filter(j => j.status === 'Open').map(j => ({ value: j.id, label: j.title }))]} required />
            <Select name="stage" label="Stage" options={STAGES.map(s => ({ value: s, label: s }))} required />
            <Select name="source" label="Source" options={SOURCES.map(s => ({ value: s, label: s }))} required />
            <Input name="rating" label="Rating (1-5)" type="number" min={1} max={5} />
            <div className="sm:col-span-2"><label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#B9D0D6] bg-[#F8FBFC] px-4 py-3"><Upload size={17} /><span className="text-sm">Upload CV (PDF/DOC)</span><input name="cv" type="file" accept=".pdf,.doc,.docx" className="sr-only" /></label></div>
            <div className="sm:col-span-2"><label className="block text-sm font-medium mb-1.5">Notes</label><textarea name="notes" rows={3} className="w-full rounded-lg border border-[#D6E4E8] px-4 py-2.5 text-sm" /></div>
          </div>
          <div className="flex justify-end gap-3"><Button variant="outline" type="button" onClick={() => p.onCandModal(false)}>Cancel</Button><Button type="submit"><UserPlus size={16} /> Save</Button></div>
        </form>
      </Modal>

      <Modal isOpen={!!detail} onClose={() => p.onDetail(null)} title="Candidate Profile & History" size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Avatar name={detail.name} size="sm" /><div className="flex-1"><p className="font-semibold text-[#17324D]">{detail.name}</p><p className="text-xs text-gray-500">{detail.email} · {detail.phone} · {detail.source}</p></div><StageBadge stage={detail.stage} /></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-[#EAF2F4]/60 border p-4 text-sm">
              <div><p className="text-[11px] text-gray-500 uppercase">Job</p><p className="font-semibold">{detail.jobTitle}</p></div>
              <div><p className="text-[11px] text-gray-500 uppercase">CV</p><p className="font-semibold">{detail.resume || '—'}</p></div>
              <div><p className="text-[11px] text-gray-500 uppercase">Rating</p><p className="font-semibold">{detail.rating ?? '—'}</p></div>
              <div><p className="text-[11px] text-gray-500 uppercase">Applied</p><p className="font-semibold">{detail.appliedDate}</p></div>
            </div>
            {detail.notes && <p className="text-sm text-gray-600 rounded-lg border p-3">Notes: {detail.notes}</p>}
            <div><p className="text-sm font-semibold mb-2">Interviews</p>{interviews.filter(i => i.candidateId === detail.id).map(i => <p key={i.id} className="text-xs text-gray-600">{i.date} {i.time} · {i.round} · {i.interviewer} · {i.status}{i.feedback ? ` — ${i.feedback}` : ''}</p>)}{interviews.filter(i => i.candidateId === detail.id).length === 0 && <p className="text-xs text-gray-400">No interviews.</p>}</div>
            <div><p className="text-sm font-semibold mb-2">History</p><div className="space-y-1.5 max-h-40 overflow-auto">{[...detail.history].reverse().map((h, i) => <div key={i} className="flex gap-2 text-xs"><span className="text-gray-400 whitespace-nowrap">{h.date}</span><span className="font-semibold">{h.action}</span><span className="text-gray-500">{h.note || ''}</span></div>)}</div></div>
            <div className="flex gap-2"><Input placeholder="Add a note…" value={noteText} onChange={e => p.onNoteText(e.target.value)} /><Button variant="outline" size="sm" onClick={p.onAddNote}>Add</Button></div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!intModal} onClose={() => p.onIntModal(null)} title="Schedule Interview" size="sm">
        {intModal && <div className="space-y-4">
          <Select label="Candidate" value={intModal.candidateId} onChange={e => p.onIntModal({ ...intModal, candidateId: e.target.value })} options={p.candidates.map(c => ({ value: c.id, label: c.name }))} />
          <div className="grid grid-cols-2 gap-3"><Input label="Date" type="date" value={intModal.date} onChange={e => p.onIntModal({ ...intModal, date: e.target.value })} /><Input label="Time" type="time" value={intModal.time} onChange={e => p.onIntModal({ ...intModal, time: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3"><Select label="Mode" value={intModal.mode} onChange={e => p.onIntModal({ ...intModal, mode: e.target.value })} options={INTERVIEW_MODES.map(m => ({ value: m, label: m }))} /><Input label="Round" value={intModal.round} onChange={e => p.onIntModal({ ...intModal, round: e.target.value })} /></div>
          <Select label="Interviewer (employee)" value={intModal.interviewer} onChange={e => p.onIntModal({ ...intModal, interviewer: e.target.value })} options={[{ value: '', label: 'Select employee interviewer…' }, ...mockEmployees.map(e => ({ value: e.id, label: `${e.firstName} ${e.lastName} — ${e.designation}` }))]} />
          <p className="text-xs text-gray-500">Selected employee will get a notification to take this interview.</p>
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => p.onIntModal(null)}>Cancel</Button><Button variant="primary" onClick={p.onSchedule} disabled={!intModal.interviewer || !intModal.date}><CalendarDays size={16} /> Schedule</Button></div>
        </div>}
      </Modal>

      <Modal isOpen={!!fbModal} onClose={() => p.onFbModal(null)} title="Interviewer Feedback" size="sm">
        {fbModal && <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1.5">Feedback</label><textarea rows={4} value={fbModal.feedback} onChange={e => p.onFbModal({ ...fbModal, feedback: e.target.value })} className="w-full rounded-lg border border-[#D6E4E8] px-4 py-2.5 text-sm" placeholder="Strengths, gaps, decision…" /></div>
          <Input label="Rating (1-5)" type="number" min={1} max={5} value={fbModal.rating} onChange={e => p.onFbModal({ ...fbModal, rating: e.target.value })} />
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => p.onFbModal(null)}>Cancel</Button><Button variant="primary" onClick={p.onSaveFeedback}>Save</Button></div>
        </div>}
      </Modal>

      <Modal isOpen={!!offerModal} onClose={() => p.onOfferModal(null)} title="Record Offer" size="sm">
        {offerModal && <div className="space-y-4">
          <Input label="Salary ($/year)" type="number" value={offerModal.salary} onChange={e => p.onOfferModal({ ...offerModal, salary: e.target.value })} />
          <Input label="Joining Date" type="date" value={offerModal.joiningDate} onChange={e => p.onOfferModal({ ...offerModal, joiningDate: e.target.value })} />
          <Input label="Notes" value={offerModal.notes} onChange={e => p.onOfferModal({ ...offerModal, notes: e.target.value })} />
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => p.onOfferModal(null)}>Cancel</Button><Button variant="primary" onClick={p.onSaveOffer}><FileText size={16} /> Save Offer</Button></div>
        </div>}
      </Modal>

      <Modal isOpen={!!offerView} onClose={() => p.onOfferView(null)} title="Offer Letter" size="lg">
        {offerView && <div className="space-y-4">
          <div className="rounded-xl border p-6 text-sm leading-6">
            <p className="font-bold text-lg">Offer Letter — CodQor</p>
            <p className="mt-2">Date: {today}</p>
            <p>Candidate: {offerView.cand.name} ({offerView.cand.email})</p>
            <p>Position: {offerView.cand.jobTitle}</p>
            <p>Salary: ${offerView.offer.salary.toLocaleString()}/year</p>
            <p>Joining: {offerView.offer.joiningDate}</p>
            <p className="mt-3">We are pleased to offer you the above position. Please confirm acceptance.</p>
            <p className="mt-4">HR, CodQor</p>
          </div>
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => p.onOfferView(null)}>Close</Button></div>
        </div>}
      </Modal>

      <Modal isOpen={!!convertModal} onClose={() => p.onConvertModal(null)} title="Convert to Employee" size="sm">
        {convertModal && <div className="space-y-4">
          <Input label="Employee Code" value={convertModal.code} onChange={e => p.onConvertModal({ ...convertModal, code: e.target.value })} placeholder="e.g. CQ-016" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Department" value={convertModal.department} onChange={e => p.onConvertModal({ ...convertModal, department: e.target.value })} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
            <Select label="Designation" value={convertModal.designation} onChange={e => p.onConvertModal({ ...convertModal, designation: e.target.value })} options={DESIGNATIONS.map(d => ({ value: d, label: d }))} />
          </div>
          <Select label="Branch" value={convertModal.branch} onChange={e => p.onConvertModal({ ...convertModal, branch: e.target.value })} options={BRANCHES.map(b => ({ value: b.name, label: b.name }))} />
          <div className="grid grid-cols-2 gap-3"><Input label="Joining Date" type="date" value={convertModal.joiningDate} onChange={e => p.onConvertModal({ ...convertModal, joiningDate: e.target.value })} /><Input label="Salary" type="number" value={convertModal.salary} onChange={e => p.onConvertModal({ ...convertModal, salary: e.target.value })} /></div>
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={() => p.onConvertModal(null)}>Cancel</Button><Button variant="primary" onClick={p.onConvert}><ArrowRight size={16} /> Convert</Button></div>
        </div>}
      </Modal>
    </>
  );
}
