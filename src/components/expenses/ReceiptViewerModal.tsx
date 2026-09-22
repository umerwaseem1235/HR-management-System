import Modal from '../ui/Modal';
import Avatar from '../ui/Avatar';
import { Paperclip, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import type { ExpenseClaim } from '../../lib/types';
import { ExpenseStatusBadge } from './expense-helpers';

interface ReceiptViewerModalProps {
  viewingExp: ExpenseClaim | null;
  viewingReceipt: string | null;
  zoom: number;
  onClose: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export default function ReceiptViewerModal({
  viewingExp,
  viewingReceipt,
  zoom,
  onClose,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: ReceiptViewerModalProps) {
  return (
    <Modal isOpen={!!viewingExp} onClose={onClose} title="Expense Details — View Receipt" size="lg">
      {viewingExp && (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Avatar name={viewingExp.employeeName} size="sm" />
            <div className="flex-1">
              <p className="text-base font-semibold text-[#17324D]">{viewingExp.employeeName}</p>
              <p className="text-xs text-gray-500">{viewingExp.description}</p>
            </div>
            <ExpenseStatusBadge status={viewingExp.status} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-[#EAF2F4]/60 border border-[#D6E4E8] px-4 py-3">
            <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Category</p><p className="text-sm font-semibold text-[#17324D]">{viewingExp.category}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Amount</p><p className="text-sm font-semibold text-[#17324D]">PKR {viewingExp.amount.toLocaleString()}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Date</p><p className="text-sm font-semibold text-[#17324D]">{viewingExp.date}</p></div>
            <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Submitted</p><p className="text-sm font-semibold text-[#17324D]">{viewingExp.submittedOn}</p></div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-[#17324D]">Receipt</p>
              {viewingReceipt && (
                <div className="flex items-center gap-2">
                  <button type="button" title="Zoom out" onClick={onZoomOut} disabled={zoom <= 0.25} className="p-1.5 rounded-lg bg-[#EAF2F4] text-[#17324D] hover:bg-[#D6E4E8] disabled:opacity-40 disabled:cursor-not-allowed"><ZoomOut size={14} /></button>
                  <span className="text-xs font-medium text-[#263238] w-12 text-center">{Math.round(zoom * 100)}%</span>
                  <button type="button" title="Zoom in" onClick={onZoomIn} disabled={zoom >= 3} className="p-1.5 rounded-lg bg-[#EAF2F4] text-[#17324D] hover:bg-[#D6E4E8] disabled:opacity-40 disabled:cursor-not-allowed"><ZoomIn size={14} /></button>
                  <button type="button" title="Reset zoom" onClick={onResetZoom} className="p-1.5 rounded-lg bg-[#EAF2F4] text-[#17324D] hover:bg-[#D6E4E8]"><RotateCcw size={14} /></button>
                </div>
              )}
            </div>
            <div className="overflow-auto max-h-[55vh] min-h-[240px] rounded-xl border border-[#D6E4E8] bg-[#EAF2F4]/40 p-3">
              {viewingReceipt?.startsWith('data:application/pdf') ? (
                <iframe
                  src={viewingReceipt}
                  title="Receipt"
                  className="mx-auto block rounded-lg bg-white border border-[#D6E4E8]"
                  style={{ width: zoom > 1 ? `${Math.round(zoom * 100)}%` : '100%', maxWidth: zoom > 1 ? 'none' : '100%', height: '50vh' }}
                />
              ) : viewingReceipt ? (
                <img
                  src={viewingReceipt}
                  alt="Expense receipt"
                  className="mx-auto block h-auto rounded-lg border border-[#D6E4E8] bg-white shadow-sm object-contain"
                  style={{ width: `${Math.round(zoom * 100)}%`, maxWidth: zoom > 1 ? 'none' : '100%' }}
                />
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 py-10 text-center">
                  <div className="p-3 rounded-full bg-white border border-[#D6E4E8]"><Paperclip size={20} className="text-gray-400" /></div>
                  <p className="text-sm font-medium text-[#17324D]">No receipt attached</p>
                  <p className="text-xs text-gray-500">Employee did not upload a receipt for this claim.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
