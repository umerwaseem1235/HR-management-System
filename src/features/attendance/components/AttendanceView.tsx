'use client';

import { CalendarDays, CheckCircle2, Trash2, UserPlus, XCircle } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import Tabs from '@/components/ui/Tabs';
import { FilterBar } from '@/components/shared';
import { todayStr } from '@/utils/date';
import { useAttendance } from '../hooks/useAttendance';
import { STATUS_OPTIONS } from '../utils';
import { DailyLogTable, MyAttendanceTable } from './AttendanceTable';
import { MyAttendanceStats, TodaySnapshot } from './AttendanceStats';
import AttendanceSummary from './AttendanceSummary';
import CorrectionQueue from './CorrectionQueue';
import EditAttendanceModal from './EditAttendanceModal';
import HolidayManager from './HolidayManager';
import LateArrivalRules from './LateArrivalRules';
import ManualEntryModal from './ManualEntryModal';

export default function AttendanceView() {
  const att = useAttendance();

  if (!att.user) return null;

  // ---- Employee view: only the logged-in employee's monthly attendance ----
  if (att.isEmployee) {
    const filteredMine = att.monthlyRecords.filter((r) => !att.statusFilter || r.status === att.statusFilter);
    const searchedMine = filteredMine.filter((r) => !att.search || r.date.toLowerCase().includes(att.search.toLowerCase()));

    return (
      <div className="space-y-6">
        <PageHeader
          title="My Attendance"
        />

        <MyAttendanceStats
          presentDays={att.presentDays}
          absentDays={att.absentDays}
          lateDays={att.lateDays}
          halfDayDays={att.halfDayDays}
          leavesTaken={att.leavesTaken}
          monthLabel={att.monthLabel}
        />

        <FilterBar
          searchValue={att.search}
          onSearchChange={att.setSearch}
          searchPlaceholder="Search by date..."
          filters={[
            {
              value: att.statusFilter,
              onChange: att.setStatusFilter,
              options: STATUS_OPTIONS,
            },
          ]}
        />

        <MyAttendanceTable records={searchedMine} monthLabel={att.monthLabel} />
      </div>
    );
  }

  // ============================================================
  //              SUPER ADMIN / HR VIEW (professional)
  // ============================================================

  const halfDayToday = att.dayRecords.filter((r) => r.status === 'Half Day').length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        actions={
          <>
            <Badge variant="success">{att.stats.presentToday} Present</Badge>
            <Badge variant="danger">{att.stats.absentToday} Absent</Badge>
            <Badge variant="warning">{att.stats.lateToday} Late</Badge>
            <Badge variant="warning">{halfDayToday} Half Day</Badge>
            <Badge variant="info">{att.stats.onLeaveToday} On Leave</Badge>
          </>
        }
      />

      {/* Today snapshot */}
      <TodaySnapshot stats={att.stats} halfDayToday={halfDayToday} />

      <Card padding="none">
        <div className="px-6 pt-4">
          <Tabs tabs={att.adminTabs} activeTab={att.activeTab} onChange={att.setActiveTab} />
        </div>
      </Card>

      {/* ---------------- DAILY LOG ---------------- */}
      {att.activeTab === 'daily' && (
        <>
          <Card padding="sm">
            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
              <div className="sm:w-[200px] shrink-0">
                <Input
                  type="date"
                  label="Date"
                  value={att.viewDate}
                  onChange={(e) => att.setViewDate(e.target.value)}
                />
              </div>
              <div className="flex-1 min-w-0">
                <SearchBar value={att.logSearch} onChange={att.setLogSearch} placeholder="Search employee…" />
              </div>
              <div className="flex gap-2 sm:ml-auto shrink-0">
                <Button variant="primary" onClick={() => att.setViewDate(todayStr())} className="whitespace-nowrap">
                  <CalendarDays size={16} /> Today
                </Button>
                <Button variant="secondary" onClick={() => att.setManualOpen(true)} className="whitespace-nowrap">
                  <UserPlus size={16} /> Manual Entry
                </Button>
              </div>
            </div>
          </Card>

          <DailyLogTable
            records={att.filteredDayRecords}
            viewDate={att.viewDate}
            logSearch={att.logSearch}
            onEdit={att.setEditingRecord}
            graceMinutes={att.lateRule.graceMinutes}
          />
        </>
      )}

      {/* ---------------- SUMMARIES ---------------- */}
      {att.activeTab === 'summaries' && (
        <AttendanceSummary
          summaryMode={att.summaryMode}
          setSummaryMode={att.setSummaryMode}
          viewDate={att.viewDate}
          setViewDate={att.setViewDate}
          agg={att.agg}
          summaryCounts={att.summaryCounts}
          summaryLabel={att.summaryLabel}
        />
      )}

      {/* ---------------- CORRECTIONS ---------------- */}
      {att.activeTab === 'corrections' && (
        <CorrectionQueue
          corrections={att.corrections}
          pendingCorrections={att.pendingCorrections}
          onApprove={att.setConfirmApproveCorrection}
          onReject={att.setConfirmRejectCorrection}
        />
      )}

      {/* ---------------- CONFIG (HOLIDAYS ONLY) ---------------- */}
      {att.activeTab === 'config' && (
        <HolidayManager
          holidays={att.holidays}
          holidayMsg={att.holidayMsg}
          onAddHoliday={att.handleAddHoliday}
          onDelete={att.setConfirmDeleteHoliday}
        />
      )}

      {/* ---------------- RULES (LATE-ARRIVAL, SEPARATE TAB) ---------------- */}
      {att.activeTab === 'rules' && (
        <div className="max-w-2xl">
          <LateArrivalRules rule={att.lateRule} onRuleChange={att.setLateRule} />
        </div>
      )}

      {/* Manual attendance entry modal */}
      <ManualEntryModal
        open={att.manualOpen}
        onClose={() => att.setManualOpen(false)}
        onSave={att.handleAddManual}
        lateRule={att.lateRule}
      />

      {/* Edit attendance record (super admin / HR) */}
      {att.editingRecord && (
        <EditAttendanceModal
          key={att.editingRecord.id}
          record={att.editingRecord}
          onClose={() => att.setEditingRecord(null)}
          onSave={att.handleUpdateRecord}
          lateRule={att.lateRule}
        />
      )}

      <ConfirmDialog
        isOpen={!!att.confirmApproveCorrection}
        onClose={() => att.setConfirmApproveCorrection(null)}
        title="Approve Correction?"
        variant="approve"
        headline={
          <>
            Approve correction for <span className="font-semibold text-[#17324D]">{att.confirmApproveCorrection?.employeeName}</span> on{' '}
            <span className="font-semibold text-[#17324D]">{att.confirmApproveCorrection?.date}</span>?
          </>
        }
        subline={att.confirmApproveCorrection ? `${att.confirmApproveCorrection.currentStatus} → ${att.confirmApproveCorrection.requestedStatus} · ${att.confirmApproveCorrection.reason}` : undefined}
        note={
          <>
            This will mark the request as <span className="font-semibold text-green-700">Approved</span> and update the attendance record.
          </>
        }
        confirmLabel="Confirm Approve"
        confirmIcon={<CheckCircle2 size={16} />}
        onConfirm={() => { if (att.confirmApproveCorrection) att.handleApproveCorrection(att.confirmApproveCorrection.id); att.setConfirmApproveCorrection(null); }}
      />

      <ConfirmDialog
        isOpen={!!att.confirmRejectCorrection}
        onClose={() => att.setConfirmRejectCorrection(null)}
        title="Reject Correction?"
        variant="reject"
        headline={
          <>
            Reject correction for <span className="font-semibold text-[#17324D]">{att.confirmRejectCorrection?.employeeName}</span> on{' '}
            <span className="font-semibold text-[#17324D]">{att.confirmRejectCorrection?.date}</span>?
          </>
        }
        subline={att.confirmRejectCorrection ? `${att.confirmRejectCorrection.currentStatus} → ${att.confirmRejectCorrection.requestedStatus} · ${att.confirmRejectCorrection.reason}` : undefined}
        note={
          <>
            This will mark the request as <span className="font-semibold text-red-600">Rejected</span>. The employee will be able to see this status.
          </>
        }
        confirmLabel="Confirm Reject"
        confirmIcon={<XCircle size={16} />}
        onConfirm={() => { if (att.confirmRejectCorrection) att.handleRejectCorrection(att.confirmRejectCorrection.id); att.setConfirmRejectCorrection(null); }}
      />

      <ConfirmDialog
        isOpen={!!att.confirmDeleteHoliday}
        onClose={() => att.setConfirmDeleteHoliday(null)}
        title="Delete Holiday?"
        variant="delete"
        headline={
          <>
            Delete <span className="font-semibold text-[#17324D]">{att.confirmDeleteHoliday?.name}</span>?
          </>
        }
        subline={att.confirmDeleteHoliday ? `${att.confirmDeleteHoliday.date} · ${att.confirmDeleteHoliday.type} holiday` : undefined}
        note={
          <>
            This action <span className="font-semibold">cannot be undone</span>. The holiday will be permanently removed from the calendar.
          </>
        }
        confirmLabel="Delete"
        confirmIcon={<Trash2 size={16} />}
        onConfirm={() => { if (att.confirmDeleteHoliday) att.setHolidays((current) => current.filter((x) => x.id !== att.confirmDeleteHoliday!.id)); att.setConfirmDeleteHoliday(null); }}
      />
    </div>
  );
}
