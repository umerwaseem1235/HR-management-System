'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { LeaveRequestForm } from '@/features/leave';

export default function LeaveRequestPage() {
  return (
    <DashboardLayout>
      <LeaveRequestForm />
    </DashboardLayout>
  );
}
