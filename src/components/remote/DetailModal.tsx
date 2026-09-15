'use client';

import React from 'react';
import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { Check } from 'lucide-react';
import type { RemoteRequest, Employee } from '../../lib/types';
import { StatusBadge } from './remote-utils';

interface DetailModalProps {
  detail: RemoteRequest | null;
  isEmployee: boolean;
  empOf: (req: RemoteRequest) => Employee | undefined;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export default function DetailModal({ detail, isEmployee, empOf, onClose, onApprove, onReject }: DetailModalProps) {
  return (
    <Modal isOpen={!!detail} onClose={onClose} title="Remote Request Details" size={isEmployee ? "md" : "lg"}>
      {detail && (() => {
        const emp = empOf(detail);
        return (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3">
              <Avatar name={detail.employeeName} size="sm" />
              <div className="flex-1">
                <p className="font-semibold text-[#17324D]">{detail.employeeName}</p>
                <p className="text-xs text-gray-500">Requested on {detail.requestedOn}</p>
              </div>
              <StatusBadge status={detail.status} />
            </div>
            {!isEmployee && emp && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl border border-[#D6E4E8] bg-[#F8FBFC] p-4">
                <div><p className="text-[11px] uppercase text-gray-500">Employee ID</p><p className="font-semibold text-[#17324D]">{emp.employeeCode}</p></div>
                <div><p className="text-[11px] uppercase text-gray-500">Department</p><p className="font-semibold text-[#17324D]">{emp.department}</p></div>
                <div><p className="text-[11px] uppercase text-gray-500">Designation</p><p className="font-semibold text-[#17324D]">{emp.designation}</p></div>
                <div><p className="text-[11px] uppercase text-gray-500">Email</p><p className="font-semibold text-[#17324D] truncate" title={emp.email}>{emp.email}</p></div>
              </div>
            )}
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
                <Button variant="outline" size="sm" onClick={() => onReject(detail.id)}>Reject</Button>
                <Button variant="primary" size="sm" onClick={() => onApprove(detail.id)}><Check size={14} /> Approve</Button>
              </div>
            )}
          </div>
        );
      })()}
    </Modal>
  );
}
