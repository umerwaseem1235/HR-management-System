'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { ProgressView } from '@/features/progress';

export default function ProgressPage() {
  return (
    <DashboardLayout>
      <ProgressView />
    </DashboardLayout>
  );
}