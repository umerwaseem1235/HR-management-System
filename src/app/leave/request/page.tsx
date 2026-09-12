'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import Card from '../../../components/ui/Card';
import PageHeader from '../../../components/ui/PageHeader';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { LEAVE_TYPES } from '../../../lib/constants';
import { mockEmployees } from '../../../lib/mock-data';
import { useAuth } from '../../../contexts/AuthContext';
import { useLeave } from '../../../contexts/LeaveContext';

function diffInDaysInclusive(start: string, end: string): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return null;
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

export default function LeaveRequestPage() {
  const { user } = useAuth();
  const { addLeaveRequest } = useLeave();
  const router = useRouter();

  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const days = useMemo(() => diffInDaysInclusive(startDate, endDate), [startDate, endDate]);

  if (!user) return null;

  const employee =
    mockEmployees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
    mockEmployees.find((e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!leaveType) nextErrors.leaveType = 'Please select a leave type.';
    if (!startDate) nextErrors.startDate = 'Start date is required.';
    if (!endDate) nextErrors.endDate = 'End date is required.';
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      nextErrors.endDate = 'End date cannot be before start date.';
    }
    if (!reason.trim()) nextErrors.reason = 'Please enter a reason for your leave.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || days === null) return;

    setSubmitting(true);
    addLeaveRequest({
      employeeId: employee?.id ?? user.id,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : user.name,
      leaveType,
      startDate,
      endDate,
      days,
      reason: reason.trim(),
    });
    router.push('/leave');
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <Link href="/leave" className="inline-flex items-center gap-2 text-sm text-[#024fa7] hover:underline">
          <ArrowLeft size={16} /> Back to Leave
        </Link>
        <PageHeader
          eyebrow="Time Off"
          title="Request Leave"
          subtitle={`Requesting as ${employee ? `${employee.firstName} ${employee.lastName}` : user.name}`}
        />
        <Card>
          <form onSubmit={handleSubmit} className="space-y-5">
            <Select
              label="Leave Type"
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              error={errors.leaveType}
              options={[
                { value: '', label: 'Select Leave Type' },
                ...LEAVE_TYPES.map((lt) => ({ value: lt.name, label: lt.name })),
              ]}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} error={errors.startDate} />
              <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} error={errors.endDate} />
            </div>
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
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for leave..."
                className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-[#263238] placeholder-gray-400 focus:ring-2 focus:outline-none ${errors.reason ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#D6E4E8] focus:border-[#024fa7] focus:ring-[#024fa7]/20'}`}
              />
              {errors.reason && <p className="mt-1 text-sm text-red-500">{errors.reason}</p>}
            </div>
            <p className="text-xs text-gray-500">Your request will be submitted with <span className="font-medium">Pending</span> status until it is approved or rejected.</p>
            <div className="flex justify-end gap-3 pt-4 border-t border-[#D6E4E8]">
              <Button variant="outline" type="button" onClick={() => router.push('/leave')}>Cancel</Button>
              <Button variant="primary" type="submit" disabled={submitting}>
                <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
