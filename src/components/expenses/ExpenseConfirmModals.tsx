import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { CheckCircle2, XCircle, Trash2 } from 'lucide-react';
import type { ExpenseClaim } from '../../lib/types';

interface ExpenseConfirmModalsProps {
  confirmApproveExp: ExpenseClaim | null;
  confirmRejectExp: ExpenseClaim | null;
  confirmDeleteExp: ExpenseClaim | null;
  onCloseApprove: () => void;
  onCloseReject: () => void;
  onCloseDelete: () => void;
  onConfirmApprove: () => void;
  onConfirmReject: () => void;
  onConfirmDelete: () => void;
}

export default function ExpenseConfirmModals({
  confirmApproveExp,
  confirmRejectExp,
  confirmDeleteExp,
  onCloseApprove,
  onCloseReject,
  onCloseDelete,
  onConfirmApprove,
  onConfirmReject,
  onConfirmDelete,
}: ExpenseConfirmModalsProps) {
  return (
    <>
      <Modal isOpen={!!confirmApproveExp} onClose={onCloseApprove} title="Approve Expense?" size="sm">
        {confirmApproveExp && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 p-4">
              <div className="p-2 rounded-full bg-white border border-green-200">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  Approve <span className="font-semibold text-[#17324D]">PKR {confirmApproveExp.amount.toLocaleString()}</span> for{' '}
                  <span className="font-semibold text-[#17324D]">{confirmApproveExp.employeeName}</span>?
                </p>
                <p className="text-xs text-gray-500 mt-1">{confirmApproveExp.category} · {confirmApproveExp.date} · {confirmApproveExp.description}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">This will mark the claim as <span className="font-semibold text-green-700">Approved</span>. You can still reimburse or delete it later.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onCloseApprove}>Cancel</Button>
              <Button
                variant="primary"
                onClick={onConfirmApprove}
              >
                <CheckCircle2 size={16} /> Confirm Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!confirmRejectExp} onClose={onCloseReject} title="Reject Expense?" size="sm">
        {confirmRejectExp && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 p-4">
              <div className="p-2 rounded-full bg-white border border-red-200">
                <XCircle size={20} className="text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  Reject <span className="font-semibold text-[#17324D]">PKR {confirmRejectExp.amount.toLocaleString()}</span> for{' '}
                  <span className="font-semibold text-[#17324D]">{confirmRejectExp.employeeName}</span>?
                </p>
                <p className="text-xs text-gray-500 mt-1">{confirmRejectExp.category} · {confirmRejectExp.date} · {confirmRejectExp.description}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">This will mark the claim as <span className="font-semibold text-red-600">Rejected</span>. The employee will be able to see this status.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onCloseReject}>Cancel</Button>
              <Button
                variant="danger"
                onClick={onConfirmReject}
              >
                <XCircle size={16} /> Confirm Reject
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!confirmDeleteExp} onClose={onCloseDelete} title="Delete Expense?" size="sm">
        {confirmDeleteExp && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-gray-50 border border-[#D6E4E8] p-4">
              <div className="p-2 rounded-full bg-white border border-[#D6E4E8]">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  Delete <span className="font-semibold text-[#17324D]">PKR {confirmDeleteExp.amount.toLocaleString()}</span> — {confirmDeleteExp.category}?
                </p>
                <p className="text-xs text-gray-500 mt-1">{confirmDeleteExp.employeeName} · {confirmDeleteExp.date} · {confirmDeleteExp.description}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">This action <span className="font-semibold">cannot be undone</span>. The claim will be permanently removed.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={onCloseDelete}>Cancel</Button>
              <Button
                variant="danger"
                onClick={onConfirmDelete}
              >
                <Trash2 size={16} /> Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
