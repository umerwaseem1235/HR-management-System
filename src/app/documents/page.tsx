'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { DocumentsView } from '@/features/documents';

export default function DocumentsPage() {
  return (
    <DashboardLayout>
      <DocumentsView />
    </DashboardLayout>
  );
}
