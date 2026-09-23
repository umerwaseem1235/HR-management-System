'use client';

import React from 'react';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Briefcase, Trash2, XCircle } from 'lucide-react';
import { DEPARTMENTS, BRANCHES } from '@/lib/constants';
import type { Job } from '@/types';
import { JobModalState } from '../hooks/useRecruitment';

interface JobModalProps {
  jobModal: JobModalState | null;
  onJobModalChange: (patch: Partial<JobModalState>) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving?: boolean;
  confirmDeleteJob: Job | null;
  onCloseDeleteConfirm: () => void;
  onConfirmDelete: (job: Job) => void;
}

export default function JobModal({
  jobModal, onJobModalChange, onClose, onSubmit, isSaving,
  confirmDeleteJob, onCloseDeleteConfirm, onConfirmDelete,
}: JobModalProps) {
  return (
    <>
      <Modal isOpen={!!jobModal} onClose={onClose} title={jobModal?.id ? 'Edit Free Position Note' : 'Note Free Position (Manual)'} size="lg">
        {jobModal && (
          <form onSubmit={onSubmit} className="space-y-4">
            <Input label="Job Title" value={jobModal.title} onChange={e => onJobModalChange({ title: e.target.value })} placeholder="e.g. Senior Frontend Developer" required />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select label="Department" value={jobModal.department} onChange={e => onJobModalChange({ department: e.target.value })} options={[{ value: '', label: 'Select' }, ...DEPARTMENTS.map(d => ({ value: d, label: d }))]} required />
              <Select label="Branch" value={jobModal.branch} onChange={e => onJobModalChange({ branch: e.target.value })} options={[{ value: '', label: 'Select' }, ...BRANCHES.map(b => ({ value: b.name, label: `${b.name} - ${b.city}` }))]} required />
              <Input label="Vacancy Count" type="number" min={1} value={jobModal.vacancies} onChange={e => onJobModalChange({ vacancies: e.target.value })} required />
            </div>
            <div><label className="block text-sm font-medium text-[#263238] mb-1.5">Requirements</label>
              <textarea rows={3} value={jobModal.requirements} onChange={e => onJobModalChange({ requirements: e.target.value })} placeholder="Skills, experience, education…" className="w-full rounded-lg border border-[#D6E4E8] px-4 py-2.5 text-sm focus:border-[#024fa7] focus:outline-none" /></div>
            <div><label className="block text-sm font-medium text-[#263238] mb-1.5">Job Description</label>
              <textarea rows={3} value={jobModal.description} onChange={e => onJobModalChange({ description: e.target.value })} placeholder="Role summary…" className="w-full rounded-lg border border-[#D6E4E8] px-4 py-2.5 text-sm focus:border-[#024fa7] focus:outline-none" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Closing Date" type="date" value={jobModal.closingDate} onChange={e => onJobModalChange({ closingDate: e.target.value })} />
              <Select label="Status" value={jobModal.status} onChange={e => onJobModalChange({ status: e.target.value as Job['status'] })} options={['Open', 'On Hold', 'Closed'].map(s => ({ value: s, label: s }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-[#D6E4E8]"><Button variant="outline" type="button" onClick={onClose} disabled={isSaving}>Cancel</Button><Button type="submit" loading={isSaving}><Briefcase size={16} /> {isSaving ? 'Saving…' : 'Save Note'}</Button></div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDeleteJob}
        onClose={onCloseDeleteConfirm}
        title="Delete Vacancy?"
        variant="delete"
        headline={
          <>
            Delete <span className="font-semibold text-[#17324D]">{confirmDeleteJob?.title}</span>?
          </>
        }
        subline={confirmDeleteJob ? `${confirmDeleteJob.department} · ${confirmDeleteJob.branch} · ${confirmDeleteJob.vacancies} opening${confirmDeleteJob.vacancies > 1 ? 's' : ''} · ${confirmDeleteJob.applicants} applicants` : undefined}
        note={
          <>
            This action <span className="font-semibold">cannot be undone</span>. The vacancy and its applicant links will be permanently removed.
          </>
        }
        confirmLabel="Delete"
        confirmIcon={<Trash2 size={16} />}
        onConfirm={() => { if (confirmDeleteJob) onConfirmDelete(confirmDeleteJob); onCloseDeleteConfirm(); }}
      />
    </>
  );
}

