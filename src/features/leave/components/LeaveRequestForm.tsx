'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import Select from '@/components/ui/Select';
import { useEmployeeDirectory } from '@/hooks/useEmployeeDirectory';
import { useAuth } from '@/contexts/AuthContext';
import { useLeave } from '@/contexts/LeaveContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { getHrAdminUserIds } from '@/lib/actions/notifications';
import { diffInDaysInclusive } from '../utils';

function timeToMinutes(t: string): number | null {
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

export default function LeaveRequestForm() {
  const { user } = useAuth();
  const { addLeaveRequest } = useLeave();
  const { addNotification } = useNotifications();
  const router = useRouter();

  // No leave-type picker: every request from this form is filed as Monthly Leave.
  const leaveType = 'Monthly Leave';
  const [duration, setDuration] = useState<'full' | 'half'>('full');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [fromTime, setFromTime] = useState('');
  const [toTime, setToTime] = useState('');
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isHalf = duration === 'half';
  const halfMinutes = useMemo(() => {
    if (!isHalf) return null;
    const f = timeToMinutes(fromTime);
    const t = timeToMinutes(toTime);
    if (f === null || t === null || t <= f) return null;
    return t - f;
  }, [isHalf, fromTime, toTime]);

  const days = useMemo(
    () => (isHalf ? (startDate ? 0.5 : null) : diffInDaysInclusive(startDate, endDate)),
    [isHalf, startDate, endDate],
  );

  const { findByUser } = useEmployeeDirectory();

  if (!user) return null;

  const employee = findByUser(user);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (isHalf) {
      if (!startDate) nextErrors.startDate = 'Date is required.';
      if (!fromTime) nextErrors.fromTime = 'Start time is required.';
      if (!toTime) nextErrors.toTime = 'End time is required.';
      const f = timeToMinutes(fromTime);
      const t = timeToMinutes(toTime);
      if (fromTime && toTime && (f === null || t === null)) {
        nextErrors.toTime = 'Enter valid times (HH:MM).';
      } else if (f !== null && t !== null) {
        if (t <= f) nextErrors.toTime = 'End time must be after start time.';
        else if (t - f > 4 * 60) nextErrors.toTime = 'Half leave allows a maximum of 4 hours.';
      }
    } else {
      if (!startDate) nextErrors.startDate = 'Start date is required.';
      if (!endDate) nextErrors.endDate = 'End date is required.';
      if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        nextErrors.endDate = 'End date cannot be before start date.';
      }
    }
    if (!reason.trim()) nextErrors.reason = 'Please enter a reason for your leave.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || days === null) return;

    setSubmitting(true);
    setSubmitError('');
    const requesterName = employee ? `${employee.firstName} ${employee.lastName}` : user.name;
    // Half-leave window is stored in the reason (no schema change) so
    // HR/admin can see it in the existing requests list.
    const finalReason = isHalf ? `${reason.trim()} [Half leave ${fromTime}–${toTime}]` : reason.trim();
    const finalEndDate = isHalf ? startDate : endDate;
    try {
      await addLeaveRequest({
        // Prefer the real employee record linked to the login (real UUID) —
        // the server also re-resolves this, satisfying the FK + RLS policy.
        employeeId: user.employeeId ?? employee?.id ?? user.id,
        employeeName: requesterName,
        leaveType,
        startDate,
        endDate: finalEndDate,
        days,
        reason: finalReason,
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit request. Please try again.');
      setSubmitting(false);
      return;
    }
    // Notify every HR manager and admin — fire-and-forget so a notification
    // failure never blocks the (already saved) request.
    try {
      const hrAdminIds = await getHrAdminUserIds();
      const when = isHalf ? `${startDate} (half leave ${fromTime}–${toTime})` : `${startDate} → ${finalEndDate}, ${days} day${days > 1 ? 's' : ''}`;
      await Promise.all(
        hrAdminIds
          .filter((id) => id !== user.id)
          .map((id) =>
            addNotification({
              userId: id,
              title: 'New Leave Request',
              message: `${requesterName} requested ${leaveType} leave (${when}).`,
              type: 'info',
              link: '/leave',
            })
          )
      );
    } catch {
      // Notification delivery failed silently — the request itself is saved.
    }
    router.push('/leave');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Link href="/leave" className="inline-flex items-center gap-2 text-sm text-[#024fa7] hover:underline">
        <ArrowLeft size={16} /> Back to Leave
      </Link>
      <PageHeader title="Request Leave" />
      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{submitError}</p>
          )}
          <Select
            label="Leave Duration"
            value={duration}
            onChange={(e) => {
              setDuration(e.target.value as 'full' | 'half');
              setErrors({});
            }}
            options={[
              { value: 'full', label: 'Full Leave' },
              { value: 'half', label: 'Half Leave (max 4 hours)' },
            ]}
          />
          {isHalf ? (
            <>
              <Input label="Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} error={errors.startDate} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="From Time" type="time" value={fromTime} onChange={(e) => setFromTime(e.target.value)} error={errors.fromTime} />
                <Input label="To Time" type="time" value={toTime} onChange={(e) => setToTime(e.target.value)} error={errors.toTime} />
              </div>
              <p className="text-xs leading-relaxed text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-4 py-2.5">
                Half leave is a single day up to <span className="font-semibold">4 hours maximum</span>. Pick the exact time window (From → To).
                {halfMinutes !== null && (
                  <> Selected: <span className="font-semibold">{Math.floor(halfMinutes / 60)}h {halfMinutes % 60 > 0 ? `${halfMinutes % 60}m` : ''}</span></>
                )}
              </p>
            </>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} error={errors.startDate} />
              <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} error={errors.endDate} />
            </div>
          )}
          <p className="text-xs leading-relaxed text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-4 py-2.5">
            <span className="font-semibold">Monthly Leave — 2 paid days per calendar month.</span>{' '}
            Quota resets on the 1st and doesn&apos;t carry forward. Days beyond the monthly quota are auto-deducted in payroll.
          </p>
          {days !== null && (
            <p className="text-sm text-[#17324D] bg-[#EAF2F4]/60 border border-[#D6E4E8] rounded-lg px-4 py-2.5">
              Duration: <span className="font-semibold">{days} day{days > 1 ? 's' : ''}</span>
              {isHalf && fromTime && toTime && halfMinutes !== null && (
                <span className="text-gray-500"> · Half leave {fromTime}–{toTime}</span>
              )}
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
          <p className="text-xs text-gray-500">
            Your request will be submitted with <span className="font-medium">Pending</span> status until it is approved or rejected.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#D6E4E8]">
            <Button variant="outline" type="button" onClick={() => router.push('/leave')}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
