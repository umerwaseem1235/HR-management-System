'use client';

import { ShiftList } from '@/components/settings/SettingsLists';
import ConfigPage from '@/components/settings/ConfigPage';

export default function ShiftsPage() {
  return (
    <ConfigPage titleKey="nav.shifts">
      <ShiftList />
    </ConfigPage>
  );
}
