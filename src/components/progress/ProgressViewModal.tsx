'use client';

import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { User, Mail, Briefcase, CalendarDays, ClipboardList, StickyNote } from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';
import { ProgressEntry } from '../../lib/types';
import { formatSubmission } from './progress-utils';

/** View-modal section card with an overlapping legend label (matches reference design). */
export function ViewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative mt-3 rounded-xl border border-[#D6E4E8] bg-white px-4 pb-4 pt-5">
      <span className="absolute -top-2.5 left-4 bg-white px-2 text-[11px] font-bold uppercase tracking-wider text-[#024fa7]">
        {title}
      </span>
      {children}
    </div>
  );
}

export function ViewField({
  icon,
  label,
  value,
  wide,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
        <span className="text-gray-400">{icon}</span> {label}
      </p>
      <p className="text-sm font-medium text-[#263238]">{value}</p>
    </div>
  );
}

interface ProgressViewModalProps {
  viewing: ProgressEntry | null;
  onClose: () => void;
}

export default function ProgressViewModal({ viewing, onClose }: ProgressViewModalProps) {
  return (
    <Modal
      isOpen={!!viewing}
      onClose={onClose}
      title="View Progress"
      size="lg"
    >
      {viewing && (() => {
        const emp = mockEmployees.find((e) =>
          viewing.employeeId
            ? e.id === viewing.employeeId
            : `${e.firstName} ${e.lastName}`.toLowerCase() === viewing.employeeName.toLowerCase(),
        );
        return (
          <div>
            <ViewSection title="Assignment Details">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ViewField icon={<User size={13} />} label="Employee Name" value={viewing.employeeName} />
                <ViewField icon={<Mail size={13} />} label="Employee Email" value={emp?.email ?? '—'} />
                <ViewField icon={<Briefcase size={13} />} label="Project" value={viewing.projectName} wide />
              </div>
            </ViewSection>
            <ViewSection title="Timeline">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ViewField icon={<CalendarDays size={13} />} label="Submission Date" value={formatSubmission(viewing.submissionDate)} />
                <ViewField icon={<ClipboardList size={13} />} label="Progress Type" value="Daily Update" />
              </div>
            </ViewSection>
            <ViewSection title="Work Summary & Notes">
              <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <span className="text-gray-400"><StickyNote size={13} /></span> Detailed Note
              </p>
              <div
                dangerouslySetInnerHTML={{ __html: viewing.description || '<p>—</p>' }}
                className="max-h-[40vh] space-y-2 overflow-y-auto text-sm leading-relaxed text-[#263238] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-[#17324D] [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-[#17324D] [&_blockquote]:border-l-2 [&_blockquote]:border-[#D6E4E8] [&_blockquote]:pl-3 [&_blockquote]:text-gray-600 [&_pre]:rounded-md [&_pre]:bg-[#EAF2F4] [&_pre]:px-2 [&_pre]:py-1 [&_pre]:text-xs [&_a]:text-[#024fa7] [&_a]:underline"
              />
            </ViewSection>
            <div className="flex justify-end pt-5">
              <Button variant="outline" type="button" onClick={onClose}>Close</Button>
            </div>
          </div>
        );
      })()}
    </Modal>
  );
}
