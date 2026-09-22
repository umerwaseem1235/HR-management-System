'use client';

import { CheckCircle2, Plus, Trash2, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import PageHeader from '@/components/ui/PageHeader';
import Tabs from '@/components/ui/Tabs';
import type { LeaveBalance } from '@/types';
import { useLeaveView } from '../hooks/useLeaveView';
import LeaveBalances from './LeaveBalances';
import { BalanceViewModal, EditBalanceModal, EditLeaveModal } from './LeaveRequestModal';
import LeaveRequestTable from './LeaveRequestTable';

export default function LeaveView() {
  const lv = useLeaveView();

  if (!lv.user) return null;

  const handleEditBalance = (bal: LeaveBalance) => {
    lv.setBalanceType(bal.leaveType);
    lv.setBalanceTotal(String(bal.total));
    lv.setBalanceErrors({});
    lv.setShowBalanceModal(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={lv.isEmployee ? 'My Leave' : 'Leave Management'}
        actions={
          lv.user.role !== 'super_admin' ? (
            <Button variant="primary" onClick={lv.goToRequestLeave}>
              <Plus size={16} /> Request Leave
            </Button>
          ) : undefined
        }
      />

      <Card padding="none">
        <div className="px-6 pt-4">
          <Tabs tabs={lv.tabs} activeTab={lv.activeTab} onChange={lv.setActiveTab} />
        </div>
        <div className="p-6">
          {lv.activeTab === 'requests' && (
            <LeaveRequestTable
              requests={lv.visibleRequests}
              isEmployee={lv.isEmployee}
              onApprove={lv.setConfirmApproveLeave}
              onReject={lv.setConfirmRejectLeave}
              onEdit={lv.openEdit}
              onDelete={lv.setConfirmDeleteLeave}
              onViewBalances={lv.setBalanceRequest}
            />
          )}
          {lv.activeTab === 'balances' && (
            <LeaveBalances balances={lv.visibleBalances} isSuperAdmin={lv.isSuperAdmin} onEditBalance={handleEditBalance} />
          )}
        </div>
      </Card>

      <EditLeaveModal
        isOpen={lv.showEditModal}
        onClose={lv.closeEdit}
        onSubmit={lv.handleEditSubmit}
        editType={lv.editType}
        setEditType={lv.setEditType}
        editStart={lv.editStart}
        setEditStart={lv.setEditStart}
        editEnd={lv.editEnd}
        setEditEnd={lv.setEditEnd}
        editReason={lv.editReason}
        setEditReason={lv.setEditReason}
        editErrors={lv.editErrors}
      />

      <EditBalanceModal
        isOpen={lv.showBalanceModal}
        onClose={lv.closeBalanceModal}
        onSubmit={lv.handleBalanceSubmit}
        balanceType={lv.balanceType}
        balanceTotal={lv.balanceTotal}
        setBalanceTotal={lv.setBalanceTotal}
        balanceErrors={lv.balanceErrors}
      />

      <BalanceViewModal
        balanceRequest={lv.balanceRequest}
        onClose={() => lv.setBalanceRequest(null)}
        balances={lv.visibleBalances}
      />

      <ConfirmDialog
        isOpen={!!lv.confirmApproveLeave}
        onClose={() => lv.setConfirmApproveLeave(null)}
        title="Approve Leave?"
        variant="approve"
        headline={
          <>
            Approve{' '}
            <span className="font-semibold text-[#17324D]">
              {lv.confirmApproveLeave?.days} day{(lv.confirmApproveLeave?.days ?? 1) > 1 ? 's' : ''} — {lv.confirmApproveLeave?.leaveType}
            </span>{' '}
            for <span className="font-semibold text-[#17324D]">{lv.confirmApproveLeave?.employeeName}</span>?
          </>
        }
        subline={lv.confirmApproveLeave ? `${lv.confirmApproveLeave.startDate} to ${lv.confirmApproveLeave.endDate} · ${lv.confirmApproveLeave.reason}` : undefined}
        note={
          <>
            This will mark the request as <span className="font-semibold text-green-700">Approved</span>. The employee&apos;s leave balance
            will be updated.
          </>
        }
        confirmLabel="Confirm Approve"
        confirmIcon={<CheckCircle2 size={16} />}
        onConfirm={() => {
          if (lv.confirmApproveLeave && lv.user) lv.confirmApprove(lv.confirmApproveLeave, lv.user.name);
        }}
      />

      <ConfirmDialog
        isOpen={!!lv.confirmRejectLeave}
        onClose={() => lv.setConfirmRejectLeave(null)}
        title="Reject Leave?"
        variant="reject"
        headline={
          <>
            Reject{' '}
            <span className="font-semibold text-[#17324D]">
              {lv.confirmRejectLeave?.days} day{(lv.confirmRejectLeave?.days ?? 1) > 1 ? 's' : ''} — {lv.confirmRejectLeave?.leaveType}
            </span>{' '}
            for <span className="font-semibold text-[#17324D]">{lv.confirmRejectLeave?.employeeName}</span>?
          </>
        }
        subline={lv.confirmRejectLeave ? `${lv.confirmRejectLeave.startDate} to ${lv.confirmRejectLeave.endDate} · ${lv.confirmRejectLeave.reason}` : undefined}
        note={
          <>
            This will mark the request as <span className="font-semibold text-red-600">Rejected</span>. The employee will be able to see this
            status.
          </>
        }
        confirmLabel="Confirm Reject"
        confirmIcon={<XCircle size={16} />}
        onConfirm={() => {
          if (lv.confirmRejectLeave && lv.user) lv.confirmReject(lv.confirmRejectLeave, lv.user.name);
        }}
      />

      <ConfirmDialog
        isOpen={!!lv.confirmDeleteLeave}
        onClose={() => lv.setConfirmDeleteLeave(null)}
        title="Delete Leave Request?"
        variant="delete"
        headline={
          <>
            Delete <span className="font-semibold text-[#17324D]">{lv.confirmDeleteLeave?.leaveType}</span> —{' '}
            {lv.confirmDeleteLeave?.startDate} to {lv.confirmDeleteLeave?.endDate}?
          </>
        }
        subline={
          lv.confirmDeleteLeave
            ? `${lv.confirmDeleteLeave.employeeName} · ${lv.confirmDeleteLeave.days} day${lv.confirmDeleteLeave.days > 1 ? 's' : ''} · ${lv.confirmDeleteLeave.reason}`
            : undefined
        }
        note={
          <>
            This action <span className="font-semibold">cannot be undone</span>. The request will be permanently removed.
          </>
        }
        confirmLabel="Delete"
        confirmIcon={<Trash2 size={16} />}
        onConfirm={() => {
          if (lv.confirmDeleteLeave) lv.deleteLeaveRequest(lv.confirmDeleteLeave.id);
          lv.setConfirmDeleteLeave(null);
        }}
      />
    </div>
  );
}
