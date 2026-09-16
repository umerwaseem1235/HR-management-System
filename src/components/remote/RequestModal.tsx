'use client';

import React from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { Plus, Wifi } from 'lucide-react';
import { formatRange } from './remote-utils';

interface RequestModalProps {
  isOpen: boolean;
  fromDate: string;
  toDate: string;
  reason: string;
  workPlan: string;
  formErrors: Record<string, string>;
  todayInput: string;
  requestedDays: number | null;
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
  onReasonChange: (v: string) => void;
  onWorkPlanChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function RequestModal({
  isOpen,
  fromDate,
  toDate,
  reason,
  workPlan,
  formErrors,
  todayInput,
  requestedDays,
  onFromDateChange,
  onToDateChange,
  onReasonChange,
  onWorkPlanChange,
  onSubmit,
  onClose,
}: RequestModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Remote Work" size="lg">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-[#D6E4E8] bg-[#F8FBFC] px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA] shadow-md ring-1 ring-black/5">
            <Wifi size={17} strokeWidth={1.6} className="text-[#024fa7]" />
          </span>
          <p className="text-xs text-gray-500">Requests are reviewed by your manager. Approved remote days count as present.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="From Date" type="date" value={fromDate} min={todayInput} onChange={(e) => onFromDateChange(e.target.value)} error={formErrors.fromDate} required />
          <Input label="To Date" type="date" value={toDate} min={todayInput} onChange={(e) => onToDateChange(e.target.value)} error={formErrors.toDate} required />
        </div>
        {requestedDays !== null && (
          <p className="text-xs font-medium text-[#024fa7] bg-[#EAF2F4]/60 border border-[#D6E4E8] rounded-lg px-3 py-2">
            {requestedDays} day{requestedDays > 1 ? 's' : ''} requested · {formatRange(fromDate, toDate)}
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-[#263238] mb-1.5">Reason</label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="e.g. Home internet setup, focus work, travel..."
            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-[#263238] placeholder-gray-400 focus:ring-2 focus:outline-none ${formErrors.reason ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#D6E4E8] focus:border-[#024fa7] focus:ring-[#024fa7]/20'}`}
          />
          {formErrors.reason && <p className="mt-1 text-sm text-red-500">{formErrors.reason}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-[#263238] mb-1.5">Work Plan <span className="font-normal text-gray-400">(optional)</span></label>
          <textarea
            rows={2}
            value={workPlan}
            onChange={(e) => onWorkPlanChange(e.target.value)}
            placeholder="What will you work on while remote?"
            className="w-full rounded-lg border border-[#D6E4E8] bg-white px-4 py-2.5 text-sm text-[#263238] placeholder-gray-400 focus:border-[#024fa7] focus:ring-2 focus:ring-[#024fa7]/20 focus:outline-none"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-[#D6E4E8]">
          <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit"><Plus size={16} /> Submit Request</Button>
        </div>
      </form>
    </Modal>
  );
}
