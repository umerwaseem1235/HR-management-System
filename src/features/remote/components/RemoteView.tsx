'use client';

import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import Card from '@/components/ui/Card';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import SearchBar from '@/components/ui/SearchBar';
import { Plus, House } from 'lucide-react';
import RemoteRequestTable from './RemoteRequestTable';
import RemoteRequestModal from './RemoteRequestModal';
import { useRemoteView, STATUS_OPTIONS } from '../hooks/useRemoteView';

export default function RemoteView() {
  const { t } = useLanguage();
  const v = useRemoteView();

  if (!v.user) return null;

  const todaysCount = v.todaysRemote.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.remote')}
        actions={
          v.isEmployee ? (
            <Button variant="primary" onClick={v.openRequestModal}>
              <Plus size={16} /> Request Remote
            </Button>
          ) : undefined
        }
      />

      {/* Who's remote today — hero banner at the very top (admin/HR only).
          Themed to match the sidebar: deep brand blue, soft glow, hairline highlight. */}
      {!v.isEmployee && (
        <div className="relative overflow-hidden rounded-2xl border border-[#013a7c]/20 bg-[#024fa7] p-5 text-white shadow-2xl shadow-[#013a7c]/40 dark:border-white/10 dark:bg-[#0f1b2e] dark:shadow-black/50">
          <div className="pointer-events-none absolute -left-20 bottom-10 h-40 w-40 rounded-full bg-[#7db9ff]/20 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="pointer-events-none absolute -right-12 -top-20 h-52 w-52 rounded-full bg-white/10" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="shrink-0 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
                <House size={22} strokeWidth={1.8} className="text-white" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </p>
                <h3 className="text-lg font-bold leading-tight tracking-tight">Who&apos;s remote today?</h3>
                <p className="text-[13px] text-white/80 truncate">
                  {todaysCount === 0
                    ? 'Nobody remote — full house in the office.'
                    : `${todaysCount} teammate${todaysCount > 1 ? 's' : ''} working remotely today.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 sm:ml-auto shrink-0">
              <div className="text-center sm:text-right">
                <p className="text-4xl font-extrabold leading-none tracking-tight tabular-nums">{todaysCount}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">
                  remote today
                </p>
              </div>
              {todaysCount === 0 && (
                <span className="rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white ring-1 ring-white/25">
                  All in office
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={v.counts.total} iconName="global" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Pending" value={v.counts.pending} iconName="time" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Approved" value={v.counts.approved} iconName="presentToday" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Rejected" value={v.counts.rejected} iconName="absentToday" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
      </div>

      {/* Filters */}
      <Card padding="sm">
        <div className="mb-3">
          <SearchBar
            value={v.search}
            onChange={(val) => { v.setSearch(val); v.setPage(1); }}
            placeholder={v.isEmployee ? 'Search reason or date…' : 'Search employee, reason or date…'}
          />
        </div>
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


