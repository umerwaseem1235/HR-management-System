'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { EmployeeDetail } from '@/features/employees';

export default function EmployeeProfilePage() {
  return (
    <DashboardLayout>
      <EmployeeDetail />
    </DashboardLayout>
  );
}
