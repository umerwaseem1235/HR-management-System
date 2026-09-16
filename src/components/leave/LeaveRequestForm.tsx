'use client';

import React from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { Send } from 'lucide-react';
import { LEAVE_TYPES } from '../../lib/constants';

interface LeaveRequestFormProps {
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  errors: Record<string, string>;
  days: number | null;
  submitting: boolean;
  onLeaveTypeChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export default function LeaveRequestForm({
  leaveType,
  startDate,
  endDate,
  reason,
  errors,
  days,
  submitting,
  onLeaveTypeChange,
  onStartDateChange,
  onEndDateChange,
  onReasonChange,
  onSubmit,
  onCancel,
}: LeaveRequestFormProps) {
  return (
    <Card>
      <form onSubmit={onSubmit} className="space-y-5">
        <Select
          label="Leave Type"
          value={leaveType}
          onChange={(e) => onLeaveTypeChange(e.target.value)}
          error={errors.leaveType}
          options={[
            { value: '', label: 'Select Leave Type' },
            ...LEAVE_TYPES.map((lt) => ({ value: lt.name, label: lt.name })),
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Start Date" type="date" value={startDate} onChange={(e) => onStartDateChange(e.target.value)} error={errors.startDate} />
          <Input label="End Date" type="date" value={endDate} onChange={(e) => onEndDateChange(e.target.value)} error={errors.endDate} />
        </div>
        {leaveType === 'Monthly Leave' && (
          <p className="text-xs leading-relaxed text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-4 py-2.5">
            <span className="font-semibold">Monthly Leave — 2 paid days per calendar month.</span>{' '}
            Quota resets on the 1st and doesn&apos;t carry forward. Days beyond the monthly quota are auto-deducted in payroll.
          </p>
        )}
        {days !== null && (
          <p className="text-sm text-[#17324D] bg-[#EAF2F4]/60 border border-[#D6E4E8] rounded-lg px-4 py-2.5">
            Duration: <span className="font-semibold">{days} day{days > 1 ? 's' : ''}</span>
          </p>
        )}
        <div>
          <label className="block text-sm font-medium text-[#263238] mb-1.5">Reason</label>
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Enter reason for leave..."
            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-[#263238] placeholder-gray-400 focus:ring-2 focus:outline-none ${errors.reason ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#D6E4E8] focus:border-[#024fa7] focus:ring-[#024fa7]/20'}`}
          />
          {errors.reason && <p className="mt-1 text-sm text-red-500">{errors.reason}</p>}
        </div>
        <p className="text-xs text-gray-500">Your request will be submitted with <span className="font-medium">Pending</span> status until it is approved or rejected.</p>
        <div className="flex justify-end gap-3 pt-4 border-t border-[#D6E4E8]">
          <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Request'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
