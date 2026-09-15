'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import SearchBar from '../../components/ui/SearchBar';
import EmptyState from '../../components/ui/EmptyState';
import {
  Plus, Eye, X, Check, ChevronLeft, ChevronRight,
  Wifi, Inbox,
} from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';
import { useAuth } from '../../contexts/AuthContext';
import { useRemote } from '../../contexts/RemoteContext';
import { useNotifications } from '../../contexts/NotificationContext';
import type { RemoteRequest } from '../../lib/types';

function diffInDaysInclusive(start: string, end: string): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return null;
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

function formatRange(from: string, to: string): string {
  if (!from) return '—';
  if (!to || to === from) return from;
  return `${from} → ${to}`;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const PER_PAGE_OPTIONS = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '20', label: '20' },
];

export default function RemotePage() {
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

  if (!user) return null;

  const statusBadge = (status: RemoteRequest['status']) => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
      Pending: 'warning',
      Approved: 'success',
      Rejected: 'danger',
      Cancelled: 'neutral',
    };
    return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
  };

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
    if (!toDate) errors.toDate = 'End date is required.';
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Remote Work Requests"
          actions={
            <Button variant="primary" onClick={() => { resetForm(); setShowRequestModal(true); }}>
              <Plus size={16} /> Request Remote
            </Button>
          }
        />

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Requests" value={counts.total} iconName="global" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
          <StatCard title="Pending" value={counts.pending} iconName="time" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
          <StatCard title="Approved" value={counts.approved} iconName="presentToday" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
          <StatCard title="Rejected" value={counts.rejected} iconName="absentToday" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        </div>

        {/* Filters */}
        <Card padding="sm">
          <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
            <div className="flex-1 min-w-0">
              <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search reason or employee..." />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:w-auto">
              <Input label="From" type="date" value={fromFilter} onChange={(e) => { setFromFilter(e.target.value); setPage(1); }} />
              <Input label="To" type="date" value={toFilter} onChange={(e) => { setToFilter(e.target.value); setPage(1); }} />
              <Select label="Status" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} options={STATUS_OPTIONS} />
            </div>
          </div>
        </Card>

        {/* Requests table */}
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead>
                <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase w-12">#</th>
                  {!isEmployee && <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee</th>}
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">From - To</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Requested On</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-[#17324D] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6E4E8]">
                {paged.map((req, idx) => (
                  <tr key={req.id} className="hover:bg-[#EAF2F4]/50">
                    <td className="px-6 py-4 text-sm text-gray-400">{(safePage - 1) * perPage + idx + 1}</td>
                    {!isEmployee && (
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={req.employeeName} size="sm" />
                          <span className="text-sm font-medium text-[#263238] whitespace-nowrap">{req.employeeName}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[#263238] whitespace-nowrap">{formatRange(req.fromDate, req.toDate)}</p>
                      <p className="text-xs text-gray-500">{req.days} day{req.days > 1 ? 's' : ''}</p>
                    </td>
                    <td className="px-6 py-4 max-w-[280px]">
                      <p className="text-sm text-[#263238] truncate" title={req.reason}>{req.reason}</p>
                      {req.workPlan && <p className="text-xs text-gray-500 truncate" title={req.workPlan}>{req.workPlan}</p>}
                    </td>
                    <td className="px-6 py-4">{statusBadge(req.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{req.requestedOn}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button title="View details" onClick={() => setDetail(req)} className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4] cursor-pointer">
                          <Eye size={16} />
                        </button>
                        {req.status === 'Pending' && (
                          <>
                            {!isEmployee && (
                              <>
                                <button title="Approve" onClick={() => setReview({ id: req.id, decision: 'Approved', comments: '' })} className="p-2 rounded-lg text-green-600 hover:bg-green-50 cursor-pointer">
                                  <Check size={16} />
                                </button>
                                <button title="Reject" onClick={() => setReview({ id: req.id, decision: 'Rejected', comments: '' })} className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer">
                                  <X size={16} />
                                </button>
                              </>
                            )}
                            <button
                              title="Cancel request"
                              onClick={() => { if (window.confirm('Cancel this remote request?')) updateRemoteStatus(req.id, 'Cancelled'); }}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-red-600 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <EmptyState
                icon={<Inbox size={32} className="text-gray-300" />}
                title="No remote requests found"
                description={search || statusFilter !== 'all' || fromFilter || toFilter ? 'Try adjusting your filters.' : 'Click “Request Remote” to submit your first remote work request.'}
              />
            )}
          </div>
          {/* Pagination footer */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-t border-[#D6E4E8]">
            <div className="flex items-center gap-2 text-sm text-gray-500 sm:ml-auto">
              <span className="whitespace-nowrap">Records per page:</span>
              <div className="w-24">
                <Select
                  value={String(perPage)}
                  onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                  options={PER_PAGE_OPTIONS}
                />
              </div>
            </div>
            <p className="text-sm text-gray-500 tabular-nums">{rangeStart} - {rangeEnd} of {filtered.length}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                title="Previous page"
                className="p-2 rounded-lg border border-[#D6E4E8] text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage >= totalPages}
                title="Next page"
                className="p-2 rounded-lg border border-[#D6E4E8] text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* Request modal */}
      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title="Request Remote Work" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-[#D6E4E8] bg-[#F8FBFC] px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA] shadow-md ring-1 ring-black/5">
              <Wifi size={17} strokeWidth={1.6} className="text-[#024fa7]" />
            </span>
            <p className="text-xs text-gray-500">Requests are reviewed by your manager. Approved remote days count as present.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="From Date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} error={formErrors.fromDate} required />
            <Input label="To Date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} error={formErrors.toDate} required />
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
              onChange={(e) => setReason(e.target.value)}
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
              onChange={(e) => setWorkPlan(e.target.value)}
              placeholder="What will you work on while remote?"
              className="w-full rounded-lg border border-[#D6E4E8] bg-white px-4 py-2.5 text-sm text-[#263238] placeholder-gray-400 focus:border-[#024fa7] focus:ring-2 focus:ring-[#024fa7]/20 focus:outline-none"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-[#D6E4E8]">
            <Button variant="outline" type="button" onClick={() => setShowRequestModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit"><Plus size={16} /> Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Detail modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title="Remote Request Details" size="md">
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Avatar name={detail.employeeName} size="sm" />
              <div className="flex-1">
                <p className="font-semibold text-[#17324D]">{detail.employeeName}</p>
                <p className="text-xs text-gray-500">Requested on {detail.requestedOn}</p>
              </div>
              {statusBadge(detail.status)}
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-[#D6E4E8] bg-[#F8FBFC] p-4">
              <div><p className="text-[11px] uppercase text-gray-500">From</p><p className="font-semibold text-[#17324D]">{detail.fromDate}</p></div>
              <div><p className="text-[11px] uppercase text-gray-500">To</p><p className="font-semibold text-[#17324D]">{detail.toDate}</p></div>
              <div><p className="text-[11px] uppercase text-gray-500">Duration</p><p className="font-semibold text-[#17324D]">{detail.days} day{detail.days > 1 ? 's' : ''}</p></div>
              <div><p className="text-[11px] uppercase text-gray-500">Status</p><p className="font-semibold text-[#17324D]">{detail.status}</p></div>
            </div>
            <div className="rounded-xl border border-[#D6E4E8] p-4">
              <p className="text-[11px] uppercase text-gray-500 mb-1">Reason</p>
              <p className="text-[#263238]">{detail.reason}</p>
              {detail.workPlan && (<><p className="text-[11px] uppercase text-gray-500 mt-3 mb-1">Work Plan</p><p className="text-[#263238]">{detail.workPlan}</p></>)}
            </div>
            {(detail.reviewedBy || detail.reviewComments) && (
              <div className="rounded-xl border border-[#D6E4E8] bg-[#EAF2F4]/40 p-4">
                <p className="text-[11px] uppercase text-gray-500 mb-1">Review</p>
                <p className="text-[#263238]">{detail.reviewedBy ? `By ${detail.reviewedBy}` : ''}{detail.reviewComments ? ` — ${detail.reviewComments}` : ''}</p>
              </div>
            )}
            {detail.status === 'Pending' && !isEmployee && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => { setReview({ id: detail.id, decision: 'Rejected', comments: '' }); setDetail(null); }}>Reject</Button>
                <Button variant="primary" size="sm" onClick={() => { setReview({ id: detail.id, decision: 'Approved', comments: '' }); setDetail(null); }}><Check size={14} /> Approve</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Review modal */}
      <Modal isOpen={!!review} onClose={() => setReview(null)} title={`${review?.decision} Remote Request`} size="sm">
        {review && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#263238] mb-1.5">Comments <span className="font-normal text-gray-400">(optional)</span></label>
              <textarea
                rows={3}
                value={review.comments}
                onChange={(e) => setReview({ ...review, comments: e.target.value })}
                placeholder={`Reason for ${review.decision.toLowerCase()}...`}
                className="w-full rounded-lg border border-[#D6E4E8] bg-white px-4 py-2.5 text-sm focus:border-[#024fa7] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setReview(null)}>Cancel</Button>
              <Button variant={review.decision === 'Approved' ? 'primary' : 'danger'} onClick={handleReview}>
                {review.decision === 'Approved' ? <><Check size={16} /> Approve</> : <><X size={16} /> Reject</>}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
