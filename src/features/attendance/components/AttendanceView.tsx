'use client';
import { useLanguage } from '@/contexts/LanguageContext';

import { CalendarDays, CheckCircle2, Trash2, UserPlus, XCircle, LogIn, LogOut } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Input from '@/components/ui/Input';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import Tabs from '@/components/ui/Tabs';
import { FilterBar, EmployeeAvatar } from '@/components/shared';
import { todayStr, formatWorkHours } from '@/utils/date';
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
  const { t } = useLanguage();
  const att = useAttendance();

  if (!att.user) return null;

  // ---- Employee view: only the logged-in employee's monthly attendance ----
  if (att.isEmployee) {
    const filteredMine = att.monthlyRecords.filter((r) => !att.statusFilter || r.status === att.statusFilter);
    const searchedMine = filteredMine.filter((r) => !att.search || r.date.toLowerCase().includes(att.search.toLowerCase()));

    // Get today's record for this employee (match by resolved id first,
    // fall back to name so legacy rows still show real check-in/out times)
    const myId = att.employeeId || att.employee?.id || '';
    const userNameLower = att.user?.name?.toLowerCase() || '';
    const todayRecord = att.attendRecords.find(
      (r) =>
        r.date === att.viewDate &&
        ((myId ? r.employeeId === myId : false) ||
          r.employeeName.toLowerCase() === userNameLower)
    );
    const hasCheckedIn = !!todayRecord?.checkIn;
    const hasCheckedOut = !!todayRecord?.checkOut;

    return (
      <div className="space-y-6">
        <PageHeader
          title="My Attendance"
        />

        {att.error && (
          <div className="rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
            {att.error}
          </div>
        )}

        {/* Inline Check In / Check Out — compact, professional */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-medium-gray bg-white dark:bg-[#1b263b]">
          <div className="flex items-center gap-3">
            <EmployeeAvatar
              name={todayRecord?.employeeName || att.user?.name || 'Employee'}
              employeeId={att.employeeId || att.employee?.id}
              avatar={att.user?.avatar || att.employee?.avatar}
              size="md"
            />
            <div>
              <p className="text-sm font-semibold text-primary dark:text-blue-gray-light">Today&apos;s Attendance</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{todayStr()}</p>
            </div>
          </div>

          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
            hasCheckedOut ? 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400' :
            hasCheckedIn ? 'bg-amber-100 text-amber-700' :
            'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
          }`}>
            {hasCheckedOut ? 'Checked Out' : hasCheckedIn ? 'Checked In' : 'Not Checked In'}
          </span>

          <div className="flex items-center gap-2 sm:ml-auto">
            <Button
              variant={hasCheckedIn ? 'outline' : 'primary'}
              size="sm"
              onClick={att.handleSelfCheckIn}
              disabled={hasCheckedIn || att.loading}
            >
              <LogIn size={14} className="mr-1.5" />
              Check In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={att.handleSelfCheckOut}
              disabled={!hasCheckedIn || hasCheckedOut || att.loading}
            >
              <LogOut size={14} className="mr-1.5" />
              Check Out
            </Button>
          </div>

          {hasCheckedIn && todayRecord && (
            <div className="sm:hidden w-full pt-2 border-t border-medium-gray flex flex-wrap items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
              <span>In: <span className="font-medium text-primary dark:text-blue-gray-light">{todayRecord.checkIn}</span></span>
              {hasCheckedOut && (
                <>
                  <span>Out: <span className="font-medium text-primary dark:text-blue-gray-light">{todayRecord.checkOut}</span></span>
                  <span>Hours: <span className="font-medium text-primary dark:text-blue-gray-light">{formatWorkHours(todayRecord.workHours)}</span></span>
                </>
              )}
            </div>
          )}
        </div>

        {hasCheckedIn && todayRecord && (
          <div className="hidden sm:flex sm:items-center sm:justify-between px-4 py-2 text-xs text-gray-600 dark:text-gray-300 bg-blue-gray-light rounded-xl border border-medium-gray">
            <span>Checked in at <span className="font-medium text-primary dark:text-blue-gray-light">{todayRecord.checkIn}</span></span>
            {hasCheckedOut && (
              <>
                <span className="mx-2">·</span>
                <span>Checked out at <span className="font-medium text-primary dark:text-blue-gray-light">{todayRecord.checkOut}</span></span>
                <span className="mx-2">·</span>
                <span>Work hours: <span className="font-medium text-primary dark:text-blue-gray-light">{formatWorkHours(todayRecord.workHours)}</span></span>
              </>
            )}
          </div>
        )}

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
        title={t('nav.attendance')}
      />

      {att.error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-700 dark:text-red-400">
          {att.error}
        </div>
      )}

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
          correctionHistory={att.correctionHistory}
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
        employees={att.employees}
        lateRule={att.lateRule}
      />

      {/* Edit attendance record (super admin / HR) */}
      {att.editingRecord && (
        <EditAttendanceModal
          key={att.editingRecord.id}
          record={att.editingRecord}
          onClose={() => att.setEditingRecord(null)}
          onSave={att.handleUpdateRecord}
          onDelete={att.handleDeleteRecord}
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
            Approve correction for <span className="font-semibold text-primary dark:text-blue-gray-light">{att.confirmApproveCorrection?.employeeName}</span> on{' '}
            <span className="font-semibold text-primary dark:text-blue-gray-light">{att.confirmApproveCorrection?.date}</span>?
          </>
        }
        subline={att.confirmApproveCorrection ? `${att.confirmApproveCorrection.currentStatus} → ${att.confirmApproveCorrection.requestedStatus} · ${att.confirmApproveCorrection.reason}` : undefined}
        note={
          <>
            This will mark the request as <span className="font-semibold text-green-700 dark:text-green-400">Approved</span> and update the attendance record.
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
            Reject correction for <span className="font-semibold text-primary dark:text-blue-gray-light">{att.confirmRejectCorrection?.employeeName}</span> on{' '}
            <span className="font-semibold text-primary dark:text-blue-gray-light">{att.confirmRejectCorrection?.date}</span>?
          </>
        }
        subline={att.confirmRejectCorrection ? `${att.confirmRejectCorrection.currentStatus} → ${att.confirmRejectCorrection.requestedStatus} · ${att.confirmRejectCorrection.reason}` : undefined}
        note={
          <>
            This will mark the request as <span className="font-semibold text-red-600 dark:text-red-400">Rejected</span>. The employee will be able to see this status.
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
            Delete <span className="font-semibold text-primary dark:text-blue-gray-light">{att.confirmDeleteHoliday?.name}</span>?
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
        onConfirm={() => { if (att.confirmDeleteHoliday) { att.handleDeleteHoliday(att.confirmDeleteHoliday.id); att.setConfirmDeleteHoliday(null); } }}
      />
    </div>
  );
}



