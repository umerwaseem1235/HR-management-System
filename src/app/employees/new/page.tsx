'use client';

import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { EmployeeFormModal } from '@/features/employees';

export default function AddEmployeePage() {
  const router = useRouter();
  const close = () => router.push('/employees');

  return (
    <DashboardLayout>
      <EmployeeFormModal isOpen onClose={close} onSave={close} />
    </DashboardLayout>
  );
}