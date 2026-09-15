'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { ReportsView } from '@/features/reports';

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <ReportsView />
    </DashboardLayout>
  );
}
