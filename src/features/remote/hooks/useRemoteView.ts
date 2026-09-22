import { useMemo, useState } from 'react';
import { mockEmployees } from '@/lib/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { useRemote } from '@/contexts/RemoteContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { getHrAdminUserIds, getEmployeeUserId } from '@/lib/actions/notifications';
import { todayStr } from '@/utils/date';
import type { RemoteRequest } from '@/types';

export const PAST_DATE_ERROR = 'Please choose a date from today onward.';

export function isPastDate(dateValue: string): boolean {
  if (!dateValue) return false;
  return dateValue < todayStr();
}

export function diffInDaysInclusive(start: string, end: string): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return null;
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

export function formatRange(from: string, to: string): string {
  if (!from) return '—';
  if (!to || to === from) return from;
  return `${from} → ${to}`;
}

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export const PER_PAGE_OPTIONS = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '20', label: '20' },
];

export function useRemoteView() {
  const { user } = useAuth();
  const { remoteRequests, addRemoteRequest, updateRemoteStatus } = useRemote();
  const { addNotification } = useNotifications();

  const [search, setSearch] = useState('');
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [workPlan, setWorkPlan] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [detail, setDetail] = useState<RemoteRequest | null>(null);
  const [review, setReview] = useState<{ id: string; decision: 'Approved' | 'Rejected'; comments: string } | null>(null);
  const [confirmCancelReq, setConfirmCancelReq] = useState<RemoteRequest | null>(null);

  const isEmployee = user?.role === 'employee';

  const employee = useMemo(() => {
    if (!user) return undefined;
    return (
      mockEmployees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
      mockEmployees.find((e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase())
    );
  }, [user]);

  const visibleRequests = useMemo(() => {
    if (!user) return [];
    if (!isEmployee) return remoteRequests;
    // Prefer the real employee record linked to the login (real UUID from DB).
    if (user.employeeId) return remoteRequests.filter((r) => r.employeeId === user.employeeId);
    return remoteRequests.filter((r) =>
      employee ? r.employeeId === employee.id : r.employeeName.toLowerCase() === user.name.toLowerCase()
    );
  }, [remoteRequests, isEmployee, employee, user]);

  const counts = useMemo(() => ({
    total: visibleRequests.length,
    pending: visibleRequests.filter((r) => r.status === 'Pending').length,
    approved: visibleRequests.filter((r) => r.status === 'Approved').length,
    rejected: visibleRequests.filter((r) => r.status === 'Rejected').length,
  }), [visibleRequests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleRequests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (fromFilter && r.toDate < fromFilter) return false;
      if (toFilter && r.fromDate > toFilter) return false;
      if (q && !`${r.reason} ${r.employeeName} ${r.fromDate} ${r.toDate}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [visibleRequests, search, fromFilter, toFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * perPage + 1;
  const rangeEnd = Math.min(safePage * perPage, filtered.length);

  const today = todayStr();
  const todaysRemote = useMemo(() => (
    visibleRequests.filter((r) => r.status === 'Approved' && r.fromDate <= today && today <= r.toDate)
  ), [visibleRequests, today]);

  const resetForm = () => {
    setFromDate('');
    setToDate('');
    setReason('');
    setWorkPlan('');
    setFormErrors({});
  };

  const openRequestModal = () => {
    resetForm();
    setShowRequestModal(true);
  };

  const todayMin = todayStr();

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    setFormErrors((prev) => {
      if (isPastDate(value)) return { ...prev, fromDate: PAST_DATE_ERROR };
      if (prev.fromDate === PAST_DATE_ERROR) {
        const next = { ...prev };
        delete next.fromDate;
        return next;
      }
      return prev;
    });
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    setFormErrors((prev) => {
      if (isPastDate(value)) return { ...prev, toDate: PAST_DATE_ERROR };
      if (prev.toDate === PAST_DATE_ERROR) {
        const next = { ...prev };
        delete next.toDate;
        return next;
      }
      return prev;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const errors: Record<string, string> = {};
    if (!fromDate) errors.fromDate = 'Start date is required.';
    else if (isPastDate(fromDate)) errors.fromDate = PAST_DATE_ERROR;
    if (!toDate) errors.toDate = 'End date is required.';
    else if (isPastDate(toDate)) errors.toDate = PAST_DATE_ERROR;
    const days = diffInDaysInclusive(fromDate, toDate);
    if (fromDate && toDate && days === null && !errors.toDate) errors.toDate = 'End date cannot be before start date.';
    if (!reason.trim()) errors.reason = 'Please enter a reason for remote work.';
    if (days !== null && days > 30) errors.toDate = 'Remote request cannot exceed 30 days.';
    // Overlap guard against own active requests
    if (days !== null && fromDate && toDate) {
      const overlap = visibleRequests.some((r) =>
        (r.status === 'Pending' || r.status === 'Approved') &&
        !(toDate < r.fromDate || fromDate > r.toDate)
      );
      if (overlap) errors.toDate = 'Overlaps with an existing pending/approved request.';
    }
    setFormErrors(errors);
    if (Object.keys(errors).length > 0 || days === null) return;

    const requesterName = employee ? `${employee.firstName} ${employee.lastName}` : user.name;
    try {
      await addRemoteRequest({
        // Prefer the real employee record linked to the login (real UUID) —
        // the server also re-resolves this, satisfying the FK + RLS policy.
        employeeId: user.employeeId ?? employee?.id ?? user.id,
        employeeName: requesterName,
        fromDate,
        toDate,
        days,
        reason: reason.trim(),
        workPlan: workPlan.trim() || undefined,
      });
    } catch (err) {
      // Keep the modal open with data intact so nothing is lost — user can retry.
      setFormErrors({ submit: err instanceof Error ? err.message : 'Failed to submit request. Please try again.' });
      return;
    }
    // Notify every HR manager and admin — fire-and-forget so a notification
    // failure never blocks the (already saved) request.
    try {
      const hrAdminIds = await getHrAdminUserIds();
      await Promise.all(
        hrAdminIds
          .filter((id) => id !== user.id)
          .map((id) =>
            addNotification({
              userId: id,
              title: 'New Remote Request',
              message: `${requesterName} requested remote work ${formatRange(fromDate, toDate)} (${days} day${days > 1 ? 's' : ''}).`,
              type: 'info',
              link: '/remote',
            })
          )
      );
    } catch {
      // Notification delivery failed silently — the request itself is saved.
    }
    setShowRequestModal(false);
    resetForm();
    setPage(1);
  };

  const handleReview = async () => {
    if (!review || !user) return;
    try {
      await updateRemoteStatus(review.id, review.decision, user.name, review.comments.trim() || undefined);
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : 'Failed to save decision. Please try again.' });
      return;
    }
    const target = remoteRequests.find((r) => r.id === review.id);
    if (target) {
      // Notify the requesting employee (fire-and-forget).
      try {
        const employeeUserId = await getEmployeeUserId(target.employeeId);
        if (employeeUserId) {
          await addNotification({
            userId: employeeUserId,
            title: `Remote Request ${review.decision}`,
            message: `Your remote request ${formatRange(target.fromDate, target.toDate)} was ${review.decision.toLowerCase()} by ${user.name}.`,
            type: review.decision === 'Approved' ? 'success' : 'error',
            link: '/remote',
          });
        }
      } catch {
        // Notification delivery failed silently — the decision itself is saved.
      }
    }
    setReview(null);
  };

  const confirmCancel = () => {
    if (confirmCancelReq) updateRemoteStatus(confirmCancelReq.id, 'Cancelled');
    setConfirmCancelReq(null);
  };

  const requestedDays = diffInDaysInclusive(fromDate, toDate);

  return {
    user,
    isEmployee,
    search, setSearch,
    fromFilter, setFromFilter,
    toFilter, setToFilter,
    statusFilter, setStatusFilter,
    page, setPage, perPage, setPerPage,
    showRequestModal, setShowRequestModal, openRequestModal,
    fromDate, setFromDate, toDate, setToDate,
    handleFromDateChange, handleToDateChange, todayMin,
    reason, setReason, workPlan, setWorkPlan, formErrors,
    detail, setDetail, review, setReview,
    confirmCancelReq, setConfirmCancelReq,
    counts, filtered, totalPages, safePage, paged, rangeStart, rangeEnd,
    todaysRemote, today,
    resetForm, handleSubmit, handleReview, confirmCancel,
    requestedDays,
  };
}

export type UseRemoteViewReturn = ReturnType<typeof useRemoteView>;
