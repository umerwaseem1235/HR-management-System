'use client';

import React from 'react';
import Tabs from '../ui/Tabs';

interface NotificationFiltersProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function NotificationFilters({ tabs, activeTab, onTabChange }: NotificationFiltersProps) {
  return (
    <div className="px-6 pt-4">
      <Tabs tabs={tabs} activeTab={activeTab} onChange={onTabChange} />
    </div>
  );
}
