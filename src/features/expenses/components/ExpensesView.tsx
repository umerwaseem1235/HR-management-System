'use client';

import { CalendarDays, CheckCircle2, Download, Paperclip, Plus, RotateCcw, Trash2, XCircle, ZoomIn, ZoomOut } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/shared';
import { useExpensesView } from '../hooks/useExpensesView';
import ExpenseModal from './ExpenseModal';
import ExpenseStats from './ExpenseStats';
import ExpenseTable from './ExpenseTable';

export default function ExpensesView() {
  const e = useExpensesView();

  if (!e.user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={e.isEmployee ? 'My Expenses' : 'Expenses'}
        actions={
          e.isEmployee ? (
            <Button variant="primary" onClick={e.openNew}><Plus size={16} /> New Claim</Button>
          ) : (
            <Button variant="primary" onClick={e.handleExportPDF}>
              <Download size={16} /> Export PDF
            </Button>
          )
        }
      />

      <ExpenseStats
        pendingTotal={e.totalPending}
        approvedCount={e.visibleExpenses.filter(x => x.status === 'Approved').length}
        reimbursedCount={e.visibleExpenses.filter(x => x.status === 'Reimbursed').length}
      />

      {!e.isEmployee && (
        <Card padding="sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-[#17324D]">
              <CalendarDays size={16} className="text-[#024fa7]" /> Expense Month
            </div>
            <div className="sm:w-64 flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  type="month"
                  aria-label="Expense month"
                  value={e.expenseMonth === 'all' ? '' : e.expenseMonth}
                  onChange={(ev) => e.setExpenseMonth(ev.target.value || 'all')}
                  className={e.expenseMonth === 'all' ? 'text-transparent' : ''}
                />
                {e.expenseMonth === 'all' && (
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    All months
                  </span>
                )}
              </div>
              {e.expenseMonth !== 'all' && (
                <button
                  type="button"
                  title="Show all months"
                  onClick={() => e.setExpenseMonth('all')}
                  className="shrink-0 rounded-lg border border-[#D6E4E8] px-3 py-2.5 text-xs font-semibold text-[#263238] hover:bg-[#EAF2F4] transition-colors cursor-pointer"
                >
                  All
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 sm:ml-auto">
              {e.visibleExpenses.length} claim{e.visibleExpenses.length !== 1 ? 's' : ''} · {e.expensePeriodLabel} · $
              {e.visibleExpenses.reduce((s, x) => s + x.amount, 0).toLocaleString()} total
            </p>
          </div>
        </Card>
      )}

      <ExpenseTable
        expenses={e.visibleExpenses}
        isEmployee={e.isEmployee}
        onApprove={e.setConfirmApproveExp}
        onReject={e.setConfirmRejectExp}
        onDelete={e.setConfirmDeleteExp}
        onEdit={e.openEdit}
        onViewReceipt={e.openReceipt}
      />

      <ExpenseModal
        isOpen={e.showModal}
        editingId={e.editingId}
        category={e.category}
        onCategoryChange={e.setCategory}
        amount={e.amount}
        onAmountChange={e.setAmount}
        date={e.date}
        onDateChange={e.setDate}
        description={e.description}
        onDescriptionChange={e.setDescription}
        errors={e.errors}
        submitting={e.submitting}
        fileKey={e.fileKey}
        receiptName={e.receiptName}
        onFileChange={e.handleFileChange}
        onRemoveFile={() => { e.setReceiptData(''); e.setReceiptName(''); e.setFileKey((k) => k + 1); }}
        onClose={() => { e.setShowModal(false); e.resetForm(); }}
        onSubmit={e.handleSubmit}
      />

      <Modal isOpen={!!e.viewingExp} onClose={e.closeReceipt} title="Expense Details — View Receipt" size="lg">
        {e.viewingExp && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <Avatar name={e.viewingExp.employeeName} size="sm" />
              <div className="flex-1">
                <p className="text-base font-semibold text-[#17324D]">{e.viewingExp.employeeName}</p>
                <p className="text-xs text-gray-500">{e.viewingExp.description}</p>
              </div>
              <StatusBadge status={e.viewingExp.status} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-[#EAF2F4]/60 border border-[#D6E4E8] p-4">
              <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Category</p><p className="text-sm font-semibold text-[#17324D]">{e.viewingExp.category}</p></div>
              <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Amount</p><p className="text-sm font-semibold text-[#17324D]">${e.viewingExp.amount.toLocaleString()}</p></div>
              <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Date</p><p className="text-sm font-semibold text-[#17324D]">{e.viewingExp.date}</p></div>
              <div><p className="text-[11px] uppercase tracking-wide text-gray-500">Submitted</p><p className="text-sm font-semibold text-[#17324D]">{e.viewingExp.submittedOn}</p></div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#17324D]">Receipt</p>
                {e.viewingReceipt && (
                  <div className="flex items-center gap-2">
                    <button type="button" title="Zoom out" onClick={e.zoomOut} disabled={e.zoom <= 0.25} className="p-1.5 rounded-lg bg-[#EAF2F4] text-[#17324D] hover:bg-[#D6E4E8] disabled:opacity-40 disabled:cursor-not-allowed"><ZoomOut size={14} /></button>
                    <span className="text-xs font-medium text-[#263238] w-12 text-center">{Math.round(e.zoom * 100)}%</span>
                    <button type="button" title="Zoom in" onClick={e.zoomIn} disabled={e.zoom >= 3} className="p-1.5 rounded-lg bg-[#EAF2F4] text-[#17324D] hover:bg-[#D6E4E8] disabled:opacity-40 disabled:cursor-not-allowed"><ZoomIn size={14} /></button>
                    <button type="button" title="Reset zoom" onClick={() => e.setZoom(1)} className="p-1.5 rounded-lg bg-[#EAF2F4] text-[#17324D] hover:bg-[#D6E4E8]"><RotateCcw size={14} /></button>
                  </div>
                )}
              </div>
              <div className="overflow-auto max-h-[55vh] min-h-[240px] rounded-xl border border-[#D6E4E8] bg-[#EAF2F4]/40 p-3">
                {e.viewingReceipt?.startsWith('data:application/pdf') ? (
                  <iframe
                    src={e.viewingReceipt}
                    title="Receipt"
                    className="mx-auto block rounded-lg bg-white border border-[#D6E4E8]"
                    style={{
                      height: '50vh',
                      width: e.zoom > 1 ? `${Math.round(e.zoom * 100)}%` : '100%',
                      maxWidth: e.zoom > 1 ? 'none' : '100%',
                    }}
                  />
                ) : e.viewingReceipt ? (
                  <img
                    src={e.viewingReceipt}
                    alt="Expense receipt"
                    className="mx-auto block h-auto rounded-lg border border-[#D6E4E8] bg-white shadow-sm object-contain"
                    style={{
                      width: `${Math.round(e.zoom * 100)}%`,
                      maxWidth: e.zoom > 1 ? 'none' : '100%',
                    }}
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

      <ConfirmDialog
        isOpen={!!e.confirmApproveExp}
        onClose={() => e.setConfirmApproveExp(null)}
        title="Approve Expense?"
        variant="approve"
        headline={
          <>
            Approve <span className="font-semibold text-[#17324D]">${e.confirmApproveExp?.amount.toLocaleString()}</span> for{' '}
            <span className="font-semibold text-[#17324D]">{e.confirmApproveExp?.employeeName}</span>?
          </>
        }
        subline={e.confirmApproveExp ? `${e.confirmApproveExp.category} · ${e.confirmApproveExp.date} · ${e.confirmApproveExp.description}` : undefined}
        note={
          <>
            This will mark the claim as <span className="font-semibold text-green-700">Approved</span>. You can still reimburse or delete it later.
          </>
        }
        confirmLabel="Confirm Approve"
        confirmIcon={<CheckCircle2 size={16} />}
        onConfirm={() => { if (e.confirmApproveExp) e.handleApproveClaim(e.confirmApproveExp.id); e.setConfirmApproveExp(null); }}
      />

      <ConfirmDialog
        isOpen={!!e.confirmRejectExp}
        onClose={() => e.setConfirmRejectExp(null)}
        title="Reject Expense?"
        variant="reject"
        headline={
          <>
            Reject <span className="font-semibold text-[#17324D]">${e.confirmRejectExp?.amount.toLocaleString()}</span> for{' '}
            <span className="font-semibold text-[#17324D]">{e.confirmRejectExp?.employeeName}</span>?
          </>
        }
        subline={e.confirmRejectExp ? `${e.confirmRejectExp.category} · ${e.confirmRejectExp.date} · ${e.confirmRejectExp.description}` : undefined}
        note={
          <>
            This will mark the claim as <span className="font-semibold text-red-600">Rejected</span>. The employee will be able to see this status.
          </>
        }
        confirmLabel="Confirm Reject"
        confirmIcon={<XCircle size={16} />}
        onConfirm={() => { if (e.confirmRejectExp) e.handleRejectClaim(e.confirmRejectExp.id); e.setConfirmRejectExp(null); }}
      />

      <ConfirmDialog
        isOpen={!!e.confirmDeleteExp}
        onClose={() => e.setConfirmDeleteExp(null)}
        title="Delete Expense?"
        variant="delete"
        headline={
          <>
            Delete <span className="font-semibold text-[#17324D]">${e.confirmDeleteExp?.amount.toLocaleString()}</span> — {e.confirmDeleteExp?.category}?
          </>
        }
        subline={e.confirmDeleteExp ? `${e.confirmDeleteExp.employeeName} · ${e.confirmDeleteExp.date} · ${e.confirmDeleteExp.description}` : undefined}
        note={
          <>
            This action <span className="font-semibold">cannot be undone</span>. The claim will be permanently removed.
          </>
        }
        confirmLabel="Delete"
        confirmIcon={<Trash2 size={16} />}
        onConfirm={() => { if (e.confirmDeleteExp) e.deleteExpenseClaim(e.confirmDeleteExp.id); e.setConfirmDeleteExp(null); }}
      />
    </div>
  );
}
