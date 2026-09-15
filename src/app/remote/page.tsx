'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';
import { useAuth } from '../../contexts/AuthContext';
import { useRequireAuth, AuthLoadingFallback } from '../../components/auth/RequireAuth';;
import { useRemote } from '../../contexts/RemoteContext';
import { useNotifications } from '../../contexts/NotificationContext';
import type { RemoteRequest } from '../../lib/types';
import { diffInDaysInclusive, formatRange } from '../../components/remote/remote-utils';
import RemoteStats from '../../components/remote/RemoteStats';
import RemoteFilters from '../../components/remote/RemoteFilters';
import RemoteTable from '../../components/remote/RemoteTable';
import RequestModal from '../../components/remote/RequestModal';
import DetailModal from '../../components/remote/DetailModal';
import ReviewModal from '../../components/remote/ReviewModal';
import { DiscardConfirmModal, CancelConfirmModal } from '../../components/remote/RemoteModals';

export default function RemotePage() {
  const { user } = useAuth();
  const { remoteRequests, addRemoteRequest, updateRemoteStatus } = useRemote();
  const { addNotification } = useNotifications();

  const [search, setSearch] = useState('');
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
  const [workPlan, setWorkPlan] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [detail, setDetail] = useState<RemoteRequest | null>(null);
  const [review, setReview] = useState<{ id: string; decision: 'Approved' | 'Rejected'; comments: string } | null>(null);
  const [reviewError, setReviewError] = useState('');
  const [cancelTarget, setCancelTarget] = useState<RemoteRequest | null>(null);

  // Today (local) as YYYY-MM-DD for date-input min + past-date validation.
  const todayInput = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

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
    return remoteRequests.filter((r) =>
      employee ? r.employeeId === employee.id : r.employeeName.toLowerCase() === user.name.toLowerCase()
    );
  }, [remoteRequests, isEmployee, employee, user]);

  const isSuperAdmin = user?.role === 'super_admin';

  const empOf = (req: RemoteRequest) =>
    mockEmployees.find((e) => e.id === req.employeeId);

  const deptOf = (req: RemoteRequest) => empOf(req)?.department ?? '—';

  const DEPT_OPTIONS = useMemo(() => [
    { value: 'all', label: 'All Departments' },
    ...Array.from(new Set(mockEmployees.map((e) => e.department)))
      .sort()
      .map((d) => ({ value: d, label: d })),
  ], []);

  const counts = useMemo(() => ({
    total: visibleRequests.length,
    pending: visibleRequests.filter((r) => r.status === 'Pending').length,
    approved: visibleRequests.filter((r) => r.status === 'Approved').length,
    rejected: visibleRequests.filter((r) => r.status === 'Rejected').length,
    currentlyRemote: visibleRequests.filter(
      (r) => r.status === 'Approved' && r.fromDate <= todayInput && todayInput <= r.toDate
    ).length,
  }), [visibleRequests, todayInput]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visibleRequests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (isEmployee) {
        if (fromFilter && r.toDate < fromFilter) return false;
        if (toFilter && r.fromDate > toFilter) return false;
      } else {
        if (dateFilter && !(r.fromDate <= dateFilter && dateFilter <= r.toDate)) return false;
        if (deptFilter !== 'all' && deptOf(r) !== deptFilter) return false;
      }
      if (q && !`${r.reason} ${r.employeeName} ${r.fromDate} ${r.toDate}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [visibleRequests, search, fromFilter, toFilter, dateFilter, deptFilter, statusFilter, isEmployee]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * perPage + 1;
  const rangeEnd = Math.min(safePage * perPage, filtered.length);

  useRequireAuth();
  if (!user) return <AuthLoadingFallback />;

  const resetForm = () => {
    setFromDate('');
    setToDate('');
    setReason('');
    setWorkPlan('');
    setFormErrors({});
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const errors: Record<string, string> = {};
    if (!fromDate) errors.fromDate = 'Start date is required.';
    else if (fromDate < todayInput) errors.fromDate = 'Please choose a date from today onward.';
    if (!toDate) errors.toDate = 'End date is required.';
    else if (toDate < todayInput) errors.toDate = 'Please choose a date from today onward.';
    const days = diffInDaysInclusive(fromDate, toDate);
    if (fromDate && toDate && days === null) errors.toDate = 'End date cannot be before start date.';
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

    addRemoteRequest({
      employeeId: employee?.id ?? user.id,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : user.name,
      fromDate,
      toDate,
      days,
      reason: reason.trim(),
      workPlan: workPlan.trim() || undefined,
    });
    addNotification({
      title: 'Remote Request Submitted',
      message: `${user.name} requested remote work ${formatRange(fromDate, toDate)} (${days} day${days > 1 ? 's' : ''}).`,
      type: 'info',
      link: '/remote',
    });
    setShowRequestModal(false);
    resetForm();
    setPage(1);
  };

  const handleReview = () => {
    if (!review || !user) return;
    if (review.decision === 'Rejected' && !review.comments.trim()) {
      setReviewError('Please enter a rejection reason.');
      return;
    }
    setReviewError('');
    updateRemoteStatus(review.id, review.decision, user.name, review.comments.trim() || undefined);
    const target = remoteRequests.find((r) => r.id === review.id);
    if (target) {
      addNotification({
        title: `Remote Request ${review.decision}`,
        message: `${target.employeeName}'s remote request ${formatRange(target.fromDate, target.toDate)} was ${review.decision.toLowerCase()} by ${user.name}.`,
        type: review.decision === 'Approved' ? 'success' : 'error',
        link: '/remote',
      });
    }
    setReview(null);
  };

  const requestedDays = diffInDaysInclusive(fromDate, toDate);

  const hasUnsavedInput = fromDate !== '' || toDate !== '' || reason.trim() !== '' || workPlan.trim() !== '';

  const attemptCloseRequest = () => {
    if (hasUnsavedInput) setShowDiscardConfirm(true);
    else { setShowRequestModal(false); resetForm(); }
  };

  const confirmDiscardRequest = () => {
    setShowDiscardConfirm(false);
    setShowRequestModal(false);
    resetForm();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Remote Work Requests"
          actions={
            !isSuperAdmin && (
              <Button variant="primary" onClick={() => { resetForm(); setShowRequestModal(true); }}>
                <Plus size={16} /> Request Remote
              </Button>
            )
          }
        />

        {/* Summary cards */}
        <RemoteStats isEmployee={!!isEmployee} counts={counts} />

        {/* Filters */}
        <RemoteFilters
          isEmployee={!!isEmployee}
          search={search}
          fromFilter={fromFilter}
          toFilter={toFilter}
          dateFilter={dateFilter}
          deptFilter={deptFilter}
          statusFilter={statusFilter}
          deptOptions={DEPT_OPTIONS}
          onSearchChange={(v) => { setSearch(v); setPage(1); }}
          onFromFilterChange={(v) => { setFromFilter(v); setPage(1); }}
          onToFilterChange={(v) => { setToFilter(v); setPage(1); }}
          onDateFilterChange={(v) => { setDateFilter(v); setPage(1); }}
          onDeptFilterChange={(v) => { setDeptFilter(v); setPage(1); }}
          onStatusFilterChange={(v) => { setStatusFilter(v); setPage(1); }}
        />

        {/* Requests table */}
        <RemoteTable
          isEmployee={!!isEmployee}
          paged={paged}
          safePage={safePage}
          perPage={perPage}
          filteredLength={filtered.length}
          totalPages={totalPages}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          search={search}
          statusFilter={statusFilter}
          fromFilter={fromFilter}
          toFilter={toFilter}
          dateFilter={dateFilter}
          deptFilter={deptFilter}
          isSuperAdmin={!!isSuperAdmin}
          empOf={empOf}
          deptOf={deptOf}
          onView={(req) => setDetail(req)}
          onCancel={(req) => setCancelTarget(req)}
          onReview={(req, decision) => { setReviewError(''); setReview({ id: req.id, decision, comments: '' }); }}
          onPerPageChange={(v) => { setPerPage(v); setPage(1); }}
          onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
          onNextPage={() => setPage((p) => Math.min(totalPages, p + 1))}
        />
      </div>

      {/* Request modal */}
      <RequestModal
        isOpen={showRequestModal}
        fromDate={fromDate}
        toDate={toDate}
        reason={reason}
        workPlan={workPlan}
        formErrors={formErrors}
        todayInput={todayInput}
        requestedDays={requestedDays}
        onFromDateChange={(v) => { setFromDate(v); setFormErrors((p) => ({ ...p, fromDate: v && v < todayInput ? 'Please choose a date from today onward.' : '' })); }}
        onToDateChange={(v) => { setToDate(v); setFormErrors((p) => ({ ...p, toDate: v && v < todayInput ? 'Please choose a date from today onward.' : '' })); }}
        onReasonChange={(v) => setReason(v)}
        onWorkPlanChange={(v) => setWorkPlan(v)}
        onSubmit={handleSubmit}
        onClose={attemptCloseRequest}
      />

      {/* Discard confirmation */}
      <DiscardConfirmModal
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={confirmDiscardRequest}
      />

      {/* Cancel request confirmation (themed) */}
      <CancelConfirmModal
        cancelTarget={cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={() => { if (cancelTarget) { updateRemoteStatus(cancelTarget.id, 'Cancelled'); setCancelTarget(null); } }}
      />

      {/* Detail modal */}
      <DetailModal
        detail={detail}
        isEmployee={!!isEmployee}
        empOf={empOf}
        onClose={() => setDetail(null)}
        onApprove={(id) => { setReviewError(''); setReview({ id, decision: 'Approved', comments: '' }); setDetail(null); }}
        onReject={(id) => { setReviewError(''); setReview({ id, decision: 'Rejected', comments: '' }); setDetail(null); }}
      />

      {/* Review modal */}
      <ReviewModal
        review={review}
        reviewError={reviewError}
        onCommentsChange={(v) => { setReview((prev) => (prev ? { ...prev, comments: v } : prev)); if (reviewError) setReviewError(''); }}
        onClose={() => { setReview(null); setReviewError(''); }}
        onSubmit={handleReview}
      />
    </DashboardLayout>
  );
}
