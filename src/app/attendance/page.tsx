'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { AttendanceView } from '@/features/attendance';

export default function AttendancePage() {
  return (
    <DashboardLayout>
      <AttendanceView />
    </DashboardLayout>
  );
}