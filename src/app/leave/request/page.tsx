'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import PageHeader from '../../../components/ui/PageHeader';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { mockEmployees } from '../../../lib/mock-data';
import { useAuth } from '../../../contexts/AuthContext';
import { useRequireAuth, AuthLoadingFallback } from '../../../components/auth/RequireAuth';
import { useLeave } from '../../../contexts/LeaveContext';
import LeaveRequestForm from '../../../components/leave/LeaveRequestForm';

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

  useRequireAuth();
  if (!user) return <AuthLoadingFallback />;

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
          title="Request Leave"
        />
        <LeaveRequestForm
          leaveType={leaveType}
          startDate={startDate}
          endDate={endDate}
          reason={reason}
          errors={errors}
          days={days}
          submitting={submitting}
          onLeaveTypeChange={setLeaveType}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          onReasonChange={setReason}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/leave')}
        />
      </div>
    </DashboardLayout>
  );
}
