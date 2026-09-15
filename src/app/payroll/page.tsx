'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { PayrollView } from '@/features/payroll';

export default function PayrollPage() {
  return (
    <DashboardLayout>
      <PayrollView />
    </DashboardLayout>
  );
}
