'use client';

import DashboardLayout from '../../components/layout/DashboardLayout';
import { useRequireAuth, AuthLoadingFallback } from '../../components/auth/RequireAuth';
import { useEmployee } from '../../hooks/useEmployee';
import { useEmployeeAttendance } from '../../hooks/useEmployeeAttendance';
import { useAdminAttendance } from '../../hooks/useAdminAttendance';
import EmployeeAttendanceView from '../../components/attendance/EmployeeAttendanceView';
import AdminAttendanceView from '../../components/attendance/AdminAttendanceView';

/**
 * Attendance page — thin routing shell.
 *
 * All business logic lives in dedicated hooks:
 * - `useEmployeeAttendance` — employee monthly stats, filters, leave overlap
 * - `useAdminAttendance` — admin state, corrections, holidays, manual entry
 *
 * All presentation lives in dedicated view components:
 * - `EmployeeAttendanceView` — employee's personal attendance table
 * - `AdminAttendanceView` — tabbed admin dashboard (daily log, summaries, corrections, holidays)
 */
export default function AttendancePage() {
  const { isEmployee } = useEmployee();
  const empData = useEmployeeAttendance();
  const adminData = useAdminAttendance();

  useRequireAuth();
  if (!empData.user) return <AuthLoadingFallback />;

  if (isEmployee) {
    return (
      <DashboardLayout>
        <EmployeeAttendanceView
          monthLabel={empData.monthLabel}
          records={empData.records}
          presentDays={empData.presentDays}
          absentDays={empData.absentDays}
          lateDays={empData.lateDays}
          leavesTaken={empData.leavesTaken}
          selectedDate={empData.selectedDate}
          statusFilter={empData.statusFilter}
          onSelectedDate={empData.onSelectedDate}
          onStatusFilter={empData.onStatusFilter}
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AdminAttendanceView {...adminData} />
    </DashboardLayout>
  );
}
