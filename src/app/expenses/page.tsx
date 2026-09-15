'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { ExpensesView } from '@/features/expenses';

export default function ExpensesPage() {
  return (
    <DashboardLayout>
      <ExpensesView />
    </DashboardLayout>
  );
}
