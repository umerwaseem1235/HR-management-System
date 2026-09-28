'use client';

import { DepartmentList } from '@/components/settings/SettingsLists';
import ConfigPage from '@/components/settings/ConfigPage';

export default function DepartmentsPage() {
  return (
    <ConfigPage titleKey="nav.departments">
      <DepartmentList />
    </ConfigPage>
  );
}
