'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import SearchBar from '@/components/ui/SearchBar';
import { Plus } from 'lucide-react';
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
          <Button variant="primary" onClick={v.openRequestModal}>
            <Plus size={16} /> Request Remote
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={v.counts.total} iconName="global" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Pending" value={v.counts.pending} iconName="time" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Approved" value={v.counts.approved} iconName="presentToday" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Rejected" value={v.counts.rejected} iconName="absentToday" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="flex-1 min-w-0">
            <SearchBar value={v.search} onChange={(val) => { v.setSearch(val); v.setPage(1); }} placeholder="Search reason or employee..." />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:w-auto">
            <Input label="From" type="date" value={v.fromFilter} onChange={(e) => { v.setFromFilter(e.target.value); v.setPage(1); }} />
            <Input label="To" type="date" value={v.toFilter} onChange={(e) => { v.setToFilter(e.target.value); v.setPage(1); }} />
            <Select label="Status" value={v.statusFilter} onChange={(e) => { v.setStatusFilter(e.target.value); v.setPage(1); }} options={STATUS_OPTIONS} />
          </div>
        </div>
      </Card>

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
        onFromDateChange={v.setFromDate}
        toDate={v.toDate}
        onToDateChange={v.setToDate}
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
