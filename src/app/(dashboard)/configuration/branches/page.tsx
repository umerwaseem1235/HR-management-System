'use client';

import { BranchList } from '@/components/settings/SettingsLists';
import ConfigPage from '@/components/settings/ConfigPage';

export default function BranchesPage() {
  return (
    <ConfigPage titleKey="nav.branches">
      <BranchList />
    </ConfigPage>
  );
}
