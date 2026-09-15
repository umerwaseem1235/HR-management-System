'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { EmployeesView } from '@/features/employees';

export default function EmployeesPage() {
  return (
    <DashboardLayout>
      <EmployeesView />
    </DashboardLayout>
  );
}
