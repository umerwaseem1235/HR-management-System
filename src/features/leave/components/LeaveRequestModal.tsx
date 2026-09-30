'use client';

import { Send } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import DatePicker from '@/components/ui/DatePicker';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import { EmployeeAvatar, StatusBadge } from '@/components/shared';
import { LEAVE_TYPES } from '@/lib/constants';
import type { LeaveBalance, LeaveRequest } from '@/types';

export function EditLeaveModal({
  isOpen,
  onClose,
  onSubmit,
  editType,
  setEditType,
  editStart,
  setEditStart,
  editEnd,
  setEditEnd,
  editReason,
  setEditReason,
  editErrors,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  editType: string;
  setEditType: (v: string) => void;
  editStart: string;
  setEditStart: (v: string) => void;
  editEnd: string;
  setEditEnd: (v: string) => void;
  editReason: string;
  setEditReason: (v: string) => void;
  editErrors: Record<string, string>;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Leave Request">
      <form onSubmit={onSubmit} className="space-y-5">
        <Select
          label="Leave Type"
          value={editType}
          onChange={(e) => setEditType(e.target.value)}
          error={editErrors.editType}
          options={[{ value: '', label: 'Select Leave Type' }, ...LEAVE_TYPES.map((lt) => ({ value: lt.name, label: lt.name }))]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DatePicker label="Start Date" value={editStart} onChange={(e) => setEditStart(e.target.value)} error={editErrors.editStart} />
          <DatePicker label="End Date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} error={editErrors.editEnd} />
        </div>
        <div>
          <label className="block text-sm font-medium text-dark-text dark:text-gray-100 mb-1.5">Reason</label>
          <textarea
            rows={4}
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
            placeholder="Enter reason for leave..."
            className={`w-full rounded-lg border bg-white dark:bg-[#1b263b] px-4 py-2.5 text-sm text-dark-text dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:outline-none ${editErrors.editReason ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-medium-gray focus:border-teal focus:ring-teal/20'}`}
          />
          {editErrors.editReason && <p className="mt-1 text-sm text-red-500">{editErrors.editReason}</p>}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
          Your request will remain <span className="font-medium">Pending</span> until it is approved or rejected.
        </p>
        <div className="flex justify-end gap-3 pt-4 border-t border-medium-gray">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            <Send size={16} /> Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function EditBalanceModal({
  isOpen,
  onClose,
  onSubmit,
  balanceType,
  balanceTotal,
  setBalanceTotal,
  balanceErrors,
  saving,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  balanceType: string;
  balanceTotal: string;
  setBalanceTotal: (v: string) => void;
  balanceErrors: Record<string, string>;
  saving?: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Balance — ${balanceType}`}>
      <form onSubmit={onSubmit} className="space-y-5">
        <Input
          label="Total Days"
          type="number"
          min="0"
          step="1"
          value={balanceTotal}
          onChange={(e) => setBalanceTotal(e.target.value)}
          error={balanceErrors.balanceTotal}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Remaining days are recalculated automatically (total − used).</p>
        <div className="flex justify-end gap-3 pt-4 border-t border-medium-gray">
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={saving} disabled={saving}>
            <Send size={16} /> {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function BalanceViewModal({
  balanceRequest,
  onClose,
  balances,
}: {
  balanceRequest: LeaveRequest | null;
  onClose: () => void;
  balances: LeaveBalance[];
}) {
  return (
    <Modal
      isOpen={!!balanceRequest}
      onClose={onClose}
      title={balanceRequest ? `Leave Request — ${balanceRequest.employeeName}` : 'Leave Request'}
      size="lg"
    >
      {balanceRequest && (
        <div className="space-y-5">
          {/* Complete request details */}
          <div className="p-4 rounded-xl bg-blue-gray/50 border border-medium-gray">
            <div className="flex flex-wrap items-center gap-3">
              <EmployeeAvatar name={balanceRequest.employeeName} employeeId={balanceRequest.employeeId} avatar={balanceRequest.employeeAvatar} size="md" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-dark-text dark:text-gray-100 truncate">{balanceRequest.employeeName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {[balanceRequest.employeeCode?.toUpperCase(), `Applied ${balanceRequest.appliedOn}`].filter(Boolean).join(' · ')}
                </p>
              </div>
              <StatusBadge status={balanceRequest.status} />
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Leave Type</p>
                <p className="mt-1"><Badge variant="info">{balanceRequest.leaveType}</Badge></p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Period</p>
                <p className="mt-1 text-sm font-medium text-dark-text dark:text-gray-100">
                  {balanceRequest.startDate} → {balanceRequest.endDate}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Duration</p>
                <p className="mt-1 text-sm font-medium text-dark-text dark:text-gray-100">
                  {balanceRequest.days} day{balanceRequest.days > 1 ? 's' : ''}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Applied On</p>
                <p className="mt-1 text-sm font-medium text-dark-text dark:text-gray-100">{balanceRequest.appliedOn}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500 dark:text-gray-400">Approved By</p>
                <p className="mt-1 text-sm font-medium text-dark-text dark:text-gray-100">{balanceRequest.approvedBy || '—'}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Reason</p>
              <p className="text-sm leading-relaxed text-dark-text dark:text-gray-100 whitespace-pre-wrap rounded-lg bg-white dark:bg-[#1b263b] border border-medium-gray px-3.5 py-3">
                {balanceRequest.reason}
              </p>
            </div>

            {balanceRequest.comments && (
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Comments</p>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{balanceRequest.comments}</p>
              </div>
            )}
          </div>

          {/* Balances */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Remaining balances for <span className="font-medium text-dark-text dark:text-gray-100">{balanceRequest.employeeName}</span>
            </p>
            {balances.map((bal) => (
              <div key={bal.leaveType} className="p-4 rounded-lg bg-blue-gray/50 border border-medium-gray">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-dark-text dark:text-gray-100">{bal.leaveType}</span>
                  <span className="text-sm font-bold text-primary dark:text-blue-gray-light">
                    {bal.remaining}/{bal.total} remaining
                  </span>
                </div>
                <div className="w-full bg-medium-gray rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-teal h-2 rounded-full"
                    style={{
                      width: `${bal.total > 0 ? Math.min(100, Math.max(0, (bal.used / bal.total) * 100)) : 0}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1.5">
                  <span>Used: {bal.used}</span>
                  <span>Total: {bal.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}
