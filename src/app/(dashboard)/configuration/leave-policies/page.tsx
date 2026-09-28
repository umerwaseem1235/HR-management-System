'use client';

import { LeaveTypeList } from '@/components/settings/SettingsLists';
import ConfigPage from '@/components/settings/ConfigPage';

export default function LeavePoliciesPage() {
  return (
    <ConfigPage titleKey="nav.leavePolicies">
      <LeaveTypeList />
    </ConfigPage>
  );
}
