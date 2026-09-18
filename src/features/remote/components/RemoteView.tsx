'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import { Plus, House } from 'lucide-react';
import RemoteRequestTable from './RemoteRequestTable';
import RemoteRequestModal from './RemoteRequestModal';
import { useRemoteView, STATUS_OPTIONS } from '../hooks/useRemoteView';

export default function RemoteView() {
  const v = useRemoteView();

  if (!v.user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Remote Work Requests"
        actions={
          v.isEmployee ? (
            <Button variant="primary" onClick={v.openRequestModal}>
              <Plus size={16} /> Request Remote
            </Button>
          ) : undefined
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={v.counts.total} iconName="global" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Pending" value={v.counts.pending} iconName="time" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Approved" value={v.counts.approved} iconName="presentToday" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Rejected" value={v.counts.rejected} iconName="absentToday" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
      </div>

      {/* Filters + Today's Remote (Today's Remote visible to admin/HR only) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <Card padding="sm" className={v.isEmployee ? 'lg:col-span-3' : 'lg:col-span-2'}>
        {v.isEmployee ? (
          <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
            <div className="grid grid-cols-2 gap-3 flex-1">
              <Input label="From" type="date" value={v.fromFilter} onChange={(e) => { v.setFromFilter(e.target.value); v.setPage(1); }} />
              <Input label="To" type="date" value={v.toFilter} onChange={(e) => { v.setToFilter(e.target.value); v.setPage(1); }} />
            </div>
            <div className="lg:w-52 shrink-0 lg:ml-auto">
              <Select label="Status" value={v.statusFilter} onChange={(e) => { v.setStatusFilter(e.target.value); v.setPage(1); }} options={STATUS_OPTIONS} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <div className="grid grid-cols-2 gap-3 sm:max-w-md flex-1">
              <Input label="From" type="date" value={v.fromFilter} onChange={(e) => { v.setFromFilter(e.target.value); v.setPage(1); }} />
              <Input label="To" type="date" value={v.toFilter} onChange={(e) => { v.setToFilter(e.target.value); v.setPage(1); }} />
            </div>
            <div className="sm:w-52 shrink-0 sm:ml-auto">
              <Select label="Status" value={v.statusFilter} onChange={(e) => { v.setStatusFilter(e.target.value); v.setPage(1); }} options={STATUS_OPTIONS} />
            </div>
          </div>
        )}
      </Card>

      {!v.isEmployee && (
      <Card padding="sm" className="flex flex-col">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="shrink-0 bg-blue-50 p-2 rounded-lg">
            <House size={18} className="text-[#024fa7]" />
          </div>
          <h3 className="text-base font-semibold text-[#17324D]">Today&apos;s Remote</h3>
          <Badge variant="info" className="ml-auto">{v.todaysRemote.length}</Badge>
        </div>
        <div className="flex-1 flex flex-col gap-2 max-h-56 overflow-y-auto">
          {v.todaysRemote.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No one is working remote today.</p>
          ) : (
            <>
              {v.todaysRemote.slice(0, 4).map((req) => (
                <button
                  key={req.id}
                  onClick={() => v.setDetail(req)}
                  className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#EAF2F4]/60 border border-transparent hover:border-[#D6E4E8] transition-colors text-left cursor-pointer"
                >
                  <Avatar name={req.employeeName} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[#263238] truncate">{req.employeeName}</span>
                    <span className="block text-xs text-gray-500 truncate">{req.fromDate === req.toDate ? req.fromDate : `${req.fromDate} → ${req.toDate}`}</span>
                  </span>
                  <Badge variant="success">Remote</Badge>
                </button>
              ))}
              {v.todaysRemote.length > 4 && (
                <p className="text-xs text-gray-500 text-center pt-1">+{v.todaysRemote.length - 4} more</p>
              )}
            </>
          )}
        </div>
      </Card>
      )}
      </div>

      <RemoteRequestTable
        paged={v.paged}
        filteredCount={v.filtered.length}
        isEmployee={v.isEmployee}
        safePage={v.safePage}
        perPage={v.perPage}
        totalPages={v.totalPages}
        rangeStart={v.rangeStart}
        rangeEnd={v.rangeEnd}
        search={v.search}
        statusFilter={v.statusFilter}
        fromFilter={v.fromFilter}
        toFilter={v.toFilter}
        onView={v.setDetail}
        onReview={(req, decision) => v.setReview({ id: req.id, decision, comments: '' })}
        onCancel={v.setConfirmCancelReq}
        onPageChange={v.setPage}
        onPerPageChange={(n) => { v.setPerPage(n); v.setPage(1); }}
      />

      <RemoteRequestModal
        showRequestModal={v.showRequestModal}
        onCloseRequestModal={() => v.setShowRequestModal(false)}
        onSubmit={v.handleSubmit}
        fromDate={v.fromDate}
        onFromDateChange={v.handleFromDateChange}
        toDate={v.toDate}
        onToDateChange={v.handleToDateChange}
        todayMin={v.todayMin}
        reason={v.reason}
        onReasonChange={v.setReason}
        workPlan={v.workPlan}
        onWorkPlanChange={v.setWorkPlan}
        formErrors={v.formErrors}
        requestedDays={v.requestedDays}
        detail={v.detail}
        onCloseDetail={() => v.setDetail(null)}
        isEmployee={v.isEmployee}
        onApproveFromDetail={(req) => { v.setReview({ id: req.id, decision: 'Approved', comments: '' }); v.setDetail(null); }}
        onRejectFromDetail={(req) => { v.setReview({ id: req.id, decision: 'Rejected', comments: '' }); v.setDetail(null); }}
        review={v.review}
        onReviewChange={(patch) => v.setReview(prev => prev ? { ...prev, ...patch } : prev)}
        onCloseReview={() => v.setReview(null)}
        onConfirmReview={v.handleReview}
        confirmCancelReq={v.confirmCancelReq}
        onCloseCancelConfirm={() => v.setConfirmCancelReq(null)}
        onConfirmCancel={v.confirmCancel}
      />
    </div>
  );
}
