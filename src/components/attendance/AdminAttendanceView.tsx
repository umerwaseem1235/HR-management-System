'use client';

import Card from '../ui/Card';
import PageHeader from '../ui/PageHeader';
import StatCard from '../ui/StatCard';
import Badge from '../ui/Badge';
import Tabs from '../ui/Tabs';
import { UserCheck, UserX, Clock, CalendarDays } from 'lucide-react';
import { mockDashboardStats } from '../../lib/mock-data';
import type { AdminAttendanceData } from '../../hooks/useAdminAttendance';
import DailyLog from './DailyLog';
import SummariesTab from './SummariesTab';
import CorrectionsTab from './CorrectionsTab';
import HolidayConfig from './HolidayConfig';
import ManualEntryModal from './ManualEntryModal';

/**
 * Pure presentation component for the admin / HR attendance view.
 *
 * Receives all data and callbacks from the `useAdminAttendance` hook
 * and delegates to existing tab sub-components. Contains zero business logic.
 */
export default function AdminAttendanceView({
  activeTab,
  onActiveTab,
  viewDate,
  onViewDate,
  dayRecords,
  manualOpen,
  onManualOpen,
  onManualClose,
  onAddManual,
  summaryMode,
  onSummaryMode,
  summaryCounts,
  agg,
  summaryLabel,
  corrections,
  pendingCorrections,
  onApproveCorrection,
  onRejectCorrection,
  holidays,
  holidayMsg,
  onAddHoliday,
  onDeleteHoliday,
  adminTabs,
}: AdminAttendanceData) {
  const stats = mockDashboardStats;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        actions={
          <>
            <Badge variant="success">{stats.presentToday} Present</Badge>
            <Badge variant="danger">{stats.absentToday} Absent</Badge>
            <Badge variant="warning">{stats.lateToday} Late</Badge>
            <Badge variant="info">{stats.onLeaveToday} On Leave</Badge>
          </>
        }
      />

      {/* Today snapshot */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Present" value={stats.presentToday} icon={<UserCheck size={18} strokeWidth={1.6} className="text-[#024fa7]" />} iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" change="Today" />
        <StatCard title="Absent" value={stats.absentToday} icon={<UserX size={18} strokeWidth={1.6} className="text-[#024fa7]" />} iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" change="Today" />
        <StatCard title="Late" value={stats.lateToday} icon={<Clock size={18} strokeWidth={1.6} className="text-[#024fa7]" />} iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" change="Today" />
        <StatCard title="On Leave" value={stats.onLeaveToday} icon={<CalendarDays size={18} strokeWidth={1.6} className="text-[#024fa7]" />} iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" change="Today" />
      </div>

      <Card padding="none">
        <div className="px-6 pt-4">
          <Tabs tabs={adminTabs} activeTab={activeTab} onChange={onActiveTab} />
        </div>
      </Card>

      {activeTab === 'daily' && (
        <DailyLog viewDate={viewDate} records={dayRecords} onViewDate={onViewDate} onManualOpen={onManualOpen} />
      )}

      {activeTab === 'summaries' && (
        <SummariesTab
          mode={summaryMode}
          viewDate={viewDate}
          records={summaryCounts}
          agg={agg}
          label={summaryLabel}
          onModeChange={onSummaryMode}
          onViewDate={onViewDate}
        />
      )}

      {activeTab === 'corrections' && (
        <CorrectionsTab
          corrections={corrections}
          pending={pendingCorrections}
          onApprove={onApproveCorrection}
          onReject={onRejectCorrection}
        />
      )}

      {activeTab === 'config' && (
        <HolidayConfig
          holidays={holidays}
          holidayMsg={holidayMsg}
          onAddHoliday={onAddHoliday}
          onDeleteHoliday={onDeleteHoliday}
        />
      )}

      <ManualEntryModal open={manualOpen} onClose={onManualClose} onSave={onAddManual} />
    </div>
  );
}
