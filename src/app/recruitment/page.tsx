'use client';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { RecruitmentView } from '@/features/recruitment';

export default function RecruitmentPage() {
  return (
    <DashboardLayout>
      <RecruitmentView />
    </DashboardLayout>
  );
}