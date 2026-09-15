'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { RemoteView } from '@/features/remote';

export default function RemotePage() {
  return (
    <DashboardLayout>
      <RemoteView />
    </DashboardLayout>
  );
}
