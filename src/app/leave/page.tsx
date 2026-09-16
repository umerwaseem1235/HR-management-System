'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { LeaveView } from '@/features/leave';

export default function LeavePage() {
  return (
    <DashboardLayout>
      <LeaveView />
    </DashboardLayout>
  );
}