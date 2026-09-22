'use client';

import React from 'react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { StatusBadge } from '@/components/shared';
import { Plus, X, Check, Wifi } from 'lucide-react';
import type { RemoteRequest } from '@/types';
import { formatRange } from '../hooks/useRemoteView';

interface RemoteRequestModalProps {
  showRequestModal: boolean;
  onCloseRequestModal: () => void;
  onSubmit: (e: React.FormEvent) => void;
  fromDate: string;
  onFromDateChange: (value: string) => void;
  toDate: string;
  onToDateChange: (value: string) => void;
  todayMin: string;
  reason: string;
  onReasonChange: (value: string) => void;
  workPlan: string;
  onWorkPlanChange: (value: string) => void;
  formErrors: Record<string, string>;
  requestedDays: number | null;
  detail: RemoteRequest | null;
  onCloseDetail: () => void;
  isEmployee: boolean;
  onApproveFromDetail: (req: RemoteRequest) => void;
  onRejectFromDetail: (req: RemoteRequest) => void;
  review: { id: string; decision: 'Approved' | 'Rejected'; comments: string } | null;
  onReviewChange: (patch: Partial<{ id: string; decision: 'Approved' | 'Rejected'; comments: string }>) => void;
  onCloseReview: () => void;
  onConfirmReview: () => void;
  confirmCancelReq: RemoteRequest | null;
  onCloseCancelConfirm: () => void;
  onConfirmCancel: () => void;
}

export default function RemoteRequestModal(props: RemoteRequestModalProps) {
  const {
    showRequestModal, onCloseRequestModal, onSubmit,
    fromDate, onFromDateChange, toDate, onToDateChange, todayMin,
    reason, onReasonChange, workPlan, onWorkPlanChange,
    formErrors, requestedDays,
    detail, onCloseDetail, isEmployee, onApproveFromDetail, onRejectFromDetail,
    review, onReviewChange, onCloseReview, onConfirmReview,
    confirmCancelReq, onCloseCancelConfirm, onConfirmCancel,
  } = props;

  return (
    <>
      {/* Request modal */}
      <Modal isOpen={showRequestModal} onClose={onCloseRequestModal} title="Request Remote Work" size="lg">
        <form onSubmit={onSubmit} className="space-y-4">
          {formErrors.submit && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{formErrors.submit}</p>
          )}
          <div className="flex items-center gap-3 rounded-xl border border-[#D6E4E8] bg-[#F8FBFC] px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA] shadow-md ring-1 ring-black/5">
              <Wifi size={17} strokeWidth={1.6} className="text-[#024fa7]" />
            </span>
            <p className="text-xs text-gray-500">Requests are reviewed by your manager. Approved remote days count as present.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="From Date" type="date" value={fromDate} min={todayMin} onChange={(e) => onFromDateChange(e.target.value)} error={formErrors.fromDate} required />
            <Input label="To Date" type="date" value={toDate} min={todayMin} onChange={(e) => onToDateChange(e.target.value)} error={formErrors.toDate} required />
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
            <Button variant="outline" type="button" onClick={onCloseRequestModal}>Cancel</Button>
            <Button variant="primary" type="submit"><Plus size={16} /> Submit Request</Button>
          </div>
        </form>
      </Modal>

      {/* Detail modal */}
      <Modal isOpen={!!detail} onClose={onCloseDetail} title="Remote Request Details" size="md">
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Avatar name={detail.employeeName} size="sm" />
              <div className="flex-1">
                <p className="font-semibold text-[#17324D]">{detail.employeeName}</p>
                <p className="text-xs text-gray-500">Requested on {detail.requestedOn}</p>
              </div>
              <StatusBadge status={detail.status} />
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
                <Button variant="outline" size="sm" onClick={() => onRejectFromDetail(detail)}>Reject</Button>
                <Button variant="primary" size="sm" onClick={() => onApproveFromDetail(detail)}><Check size={14} /> Approve</Button>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Review modal */}
      <Modal isOpen={!!review} onClose={onCloseReview} title={`${review?.decision} Remote Request`} size="sm">
        {review && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#263238] mb-1.5">Comments <span className="font-normal text-gray-400">(optional)</span></label>
              <textarea
                rows={3}
                value={review.comments}
                onChange={(e) => onReviewChange({ comments: e.target.value })}
                placeholder={`Reason for ${review.decision.toLowerCase()}...`}
                className="w-full rounded-lg border border-[#D6E4E8] bg-white px-4 py-2.5 text-sm focus:border-[#024fa7] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onCloseReview}>Cancel</Button>
              <Button variant={review.decision === 'Approved' ? 'primary' : 'danger'} onClick={onConfirmReview}>
                {review.decision === 'Approved' ? <><Check size={16} /> Approve</> : <><X size={16} /> Reject</>}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmCancelReq}
        onClose={onCloseCancelConfirm}
        title="Cancel Remote Request?"
        variant="warning"
        headline={
          <>
            Cancel <span className="font-semibold text-[#17324D]">{confirmCancelReq?.days} day{(confirmCancelReq?.days ?? 1) > 1 ? 's' : ''}</span> of remote work — {confirmCancelReq ? formatRange(confirmCancelReq.fromDate, confirmCancelReq.toDate) : ''}?
          </>
        }
        subline={confirmCancelReq ? `${confirmCancelReq.employeeName} · ${confirmCancelReq.reason}` : undefined}
        note={
          <>
            This will mark the request as <span className="font-semibold text-amber-700">Cancelled</span>. You can submit a new request later if needed.
          </>
        }
        confirmLabel="Confirm Cancel"
        confirmIcon={<X size={16} />}
        onConfirm={onConfirmCancel}
      />
    </>
  );
}
