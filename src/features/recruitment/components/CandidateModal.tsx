'use client';

import React from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/shared';
import { UserPlus, Upload, CalendarDays, FileText, ArrowRight, XCircle } from 'lucide-react';
import { DEPARTMENTS, BRANCHES, DESIGNATIONS } from '@/lib/constants';
import type { Employee, Job } from '@/types';
import { CandidateExt, Interview, Offer, SOURCES, STAGES, INTERVIEW_MODES, today } from '../types';

interface CandidateModalProps {
  jobs: Job[];
  candidates: CandidateExt[];
  interviews: Interview[];
  employees: Employee[];
  candModal: boolean;
  onCloseCandModal: () => void;
  onAddCandidate: (e: React.FormEvent<HTMLFormElement>) => void;
  detail: CandidateExt | null;
  onCloseDetail: () => void;
  noteText: string;
  onNoteTextChange: (value: string) => void;
  onAddNote: () => void;
  intModal: { candidateId: string; date: string; time: string; mode: string; interviewer: string; round: string } | null;
  onIntModalChange: (patch: Partial<{ candidateId: string; date: string; time: string; mode: string; interviewer: string; round: string }>) => void;
  onCloseIntModal: () => void;
  onScheduleInterview: () => void;
  fbModal: { id: string; feedback: string; rating: string } | null;
  onFbModalChange: (patch: Partial<{ id: string; feedback: string; rating: string }>) => void;
  onCloseFbModal: () => void;
  onSaveFeedback: () => void;
  offerModal: { candidateId: string; salary: string; joiningDate: string; notes: string } | null;
  onOfferModalChange: (patch: Partial<{ candidateId: string; salary: string; joiningDate: string; notes: string }>) => void;
  onCloseOfferModal: () => void;
  onSaveOffer: () => void;
  offerView: { cand: CandidateExt; offer: Offer } | null;
  onCloseOfferView: () => void;
  convertModal: { candidateId: string; code: string; department: string; designation: string; branch: string; joiningDate: string; salary: string } | null;
  onConvertModalChange: (patch: Partial<{ candidateId: string; code: string; department: string; designation: string; branch: string; joiningDate: string; salary: string }>) => void;
  onCloseConvertModal: () => void;
  onConvertToEmployee: () => void;
  confirmCancelInterview: Interview | null;
  onCloseCancelInterview: () => void;
  onConfirmCancelInterview: (id: string) => void;
}

export default function CandidateModal(props: CandidateModalProps) {
  const {
    jobs, candidates, interviews, employees,
    candModal, onCloseCandModal, onAddCandidate,
    detail, onCloseDetail, noteText, onNoteTextChange, onAddNote,
    intModal, onIntModalChange, onCloseIntModal, onScheduleInterview,
    fbModal, onFbModalChange, onCloseFbModal, onSaveFeedback,
    offerModal, onOfferModalChange, onCloseOfferModal, onSaveOffer,
    offerView, onCloseOfferView,
    convertModal, onConvertModalChange, onCloseConvertModal, onConvertToEmployee,
    confirmCancelInterview, onCloseCancelInterview, onConfirmCancelInterview,
  } = props;

  return (
    <>
      {/* candidate modal */}
      <Modal isOpen={candModal} onClose={onCloseCandModal} title="Note Candidate (Manual, for HR reminder)" size="lg">
        <form onSubmit={onAddCandidate} className="space-y-4">
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
          <div className="flex justify-end gap-3"><Button variant="outline" type="button" onClick={onCloseCandModal}>Cancel</Button><Button type="submit"><UserPlus size={16} /> Save</Button></div>
        </form>
      </Modal>

      {/* detail */}
      <Modal isOpen={!!detail} onClose={onCloseDetail} title="Candidate Profile & History" size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-3"><Avatar name={detail.name} size="sm" /><div className="flex-1"><p className="font-semibold text-[#17324D]">{detail.name}</p><p className="text-xs text-gray-500">{detail.email} · {detail.phone} · {detail.source}</p></div><StatusBadge status={detail.stage} /></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-[#EAF2F4]/60 border p-4 text-sm">
              <div><p className="text-[11px] text-gray-500 uppercase">Job</p><p className="font-semibold">{detail.jobTitle}</p></div>
              <div><p className="text-[11px] text-gray-500 uppercase">CV</p><p className="font-semibold">{detail.resume || '—'}</p></div>
              <div><p className="text-[11px] text-gray-500 uppercase">Rating</p><p className="font-semibold">{detail.rating ?? '—'}</p></div>
              <div><p className="text-[11px] text-gray-500 uppercase">Applied</p><p className="font-semibold">{detail.appliedDate}</p></div>
            </div>
            {detail.notes && <p className="text-sm text-gray-600 rounded-lg border p-3">Notes: {detail.notes}</p>}
            <div><p className="text-sm font-semibold mb-2">Interviews</p>{interviews.filter(i => i.candidateId === detail.id).map(i => <p key={i.id} className="text-xs text-gray-600">{i.date} {i.time} · {i.round} · {i.interviewer} · {i.status}{i.feedback ? ` — ${i.feedback}` : ''}</p>)}{interviews.filter(i => i.candidateId === detail.id).length === 0 && <p className="text-xs text-gray-400">No interviews.</p>}</div>
            <div><p className="text-sm font-semibold mb-2">History</p><div className="space-y-1.5 max-h-40 overflow-auto">{[...detail.history].reverse().map((h, i) => <div key={i} className="flex gap-2 text-xs"><span className="text-gray-400 whitespace-nowrap">{h.date}</span><span className="font-semibold">{h.action}</span><span className="text-gray-500">{h.note || ''}</span></div>)}</div></div>
            <div className="flex gap-2"><Input placeholder="Add a note…" value={noteText} onChange={e => onNoteTextChange(e.target.value)} /><Button variant="outline" size="sm" onClick={onAddNote}>Add</Button></div>
          </div>
        )}
      </Modal>

      {/* interview */}
      <Modal isOpen={!!intModal} onClose={onCloseIntModal} title="Schedule Interview" size="sm">
        {intModal && <div className="space-y-4">
          <Select label="Candidate" value={intModal.candidateId} onChange={e => onIntModalChange({ candidateId: e.target.value })} options={candidates.map(c => ({ value: c.id, label: c.name }))} />
          <div className="grid grid-cols-2 gap-3"><Input label="Date" type="date" value={intModal.date} onChange={e => onIntModalChange({ date: e.target.value })} /><Input label="Time" type="time" value={intModal.time} onChange={e => onIntModalChange({ time: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3"><Select label="Mode" value={intModal.mode} onChange={e => onIntModalChange({ mode: e.target.value })} options={INTERVIEW_MODES.map(m => ({ value: m, label: m }))} /><Input label="Round" value={intModal.round} onChange={e => onIntModalChange({ round: e.target.value })} /></div>
          <Select label="Interviewer (employee)" value={intModal.interviewer} onChange={e => onIntModalChange({ interviewer: e.target.value })} options={[{ value: '', label: 'Select employee interviewer…' }, ...employees.map(e => ({ value: e.id, label: `${e.firstName} ${e.lastName} — ${e.designation}` }))]} />
          <p className="text-xs text-gray-500">Selected employee will get a notification to take this interview.</p>
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={onCloseIntModal}>Cancel</Button><Button variant="primary" onClick={onScheduleInterview} disabled={!intModal.interviewer || !intModal.date}><CalendarDays size={16} /> Schedule</Button></div>
        </div>}
      </Modal>

      <Modal isOpen={!!fbModal} onClose={onCloseFbModal} title="Interviewer Feedback" size="sm">
        {fbModal && <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1.5">Feedback</label><textarea rows={4} value={fbModal.feedback} onChange={e => onFbModalChange({ feedback: e.target.value })} className="w-full rounded-lg border border-[#D6E4E8] px-4 py-2.5 text-sm" placeholder="Strengths, gaps, decision…" /></div>
          <Input label="Rating (1-5)" type="number" min={1} max={5} value={fbModal.rating} onChange={e => onFbModalChange({ rating: e.target.value })} />
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={onCloseFbModal}>Cancel</Button><Button variant="primary" onClick={onSaveFeedback}>Save</Button></div>
        </div>}
      </Modal>

      {/* offer */}
      <Modal isOpen={!!offerModal} onClose={onCloseOfferModal} title="Record Offer" size="sm">
        {offerModal && <div className="space-y-4">
          <Input label="Salary ($/year)" type="number" value={offerModal.salary} onChange={e => onOfferModalChange({ salary: e.target.value })} />
          <Input label="Joining Date" type="date" value={offerModal.joiningDate} onChange={e => onOfferModalChange({ joiningDate: e.target.value })} />
          <Input label="Notes" value={offerModal.notes} onChange={e => onOfferModalChange({ notes: e.target.value })} />
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={onCloseOfferModal}>Cancel</Button><Button variant="primary" onClick={onSaveOffer}><FileText size={16} /> Save Offer</Button></div>
        </div>}
      </Modal>

      <Modal isOpen={!!offerView} onClose={onCloseOfferView} title="Offer Letter" size="lg">
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
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={onCloseOfferView}>Close</Button></div>
        </div>}
      </Modal>

      {/* convert */}
      <Modal isOpen={!!convertModal} onClose={onCloseConvertModal} title="Convert to Employee" size="sm">
        {convertModal && <div className="space-y-4">
          <Input label="Employee Code" value={convertModal.code} onChange={e => onConvertModalChange({ code: e.target.value })} placeholder="e.g. CQ-016" />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Department" value={convertModal.department} onChange={e => onConvertModalChange({ department: e.target.value })} options={DEPARTMENTS.map(d => ({ value: d, label: d }))} />
            <Select label="Designation" value={convertModal.designation} onChange={e => onConvertModalChange({ designation: e.target.value })} options={DESIGNATIONS.map(d => ({ value: d, label: d }))} />
          </div>
          <Select label="Branch" value={convertModal.branch} onChange={e => onConvertModalChange({ branch: e.target.value })} options={BRANCHES.map(b => ({ value: b.name, label: b.name }))} />
          <div className="grid grid-cols-2 gap-3"><Input label="Joining Date" type="date" value={convertModal.joiningDate} onChange={e => onConvertModalChange({ joiningDate: e.target.value })} /><Input label="Salary" type="number" value={convertModal.salary} onChange={e => onConvertModalChange({ salary: e.target.value })} /></div>
          <div className="flex justify-end gap-3"><Button variant="outline" onClick={onCloseConvertModal}>Cancel</Button><Button variant="primary" onClick={onConvertToEmployee}><ArrowRight size={16} /> Convert</Button></div>
        </div>}
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmCancelInterview}
        onClose={onCloseCancelInterview}
        title="Cancel Interview?"
        variant="warning"
        headline={
          <>
            Cancel <span className="font-semibold text-[#17324D]">{confirmCancelInterview?.round}</span> for{' '}
            <span className="font-semibold text-[#17324D]">{candidates.find(c => c.id === confirmCancelInterview?.candidateId)?.name}</span>?
          </>
        }
        subline={confirmCancelInterview ? `${confirmCancelInterview.date} ${confirmCancelInterview.time} · ${confirmCancelInterview.mode} · ${confirmCancelInterview.interviewer}` : undefined}
        note={
          <>
            This will mark the interview as <span className="font-semibold text-amber-700">Cancelled</span>. You can schedule a new interview later if needed.
          </>
        }
        confirmLabel="Confirm Cancel"
        confirmIcon={<XCircle size={16} />}
        onConfirm={() => { if (confirmCancelInterview) onConfirmCancelInterview(confirmCancelInterview.id); onCloseCancelInterview(); }}
      />
    </>
  );
}
