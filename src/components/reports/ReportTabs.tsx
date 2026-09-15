'use client';

import React from 'react';
import type { TabId } from './report-utils';

interface ReportTabsProps {
  tab: TabId;
  onChange: (t: TabId) => void;
}

export default function ReportTabs({ tab, onChange }: ReportTabsProps) {
  return (
    <div className="inline-flex rounded-xl bg-[#EAF2F4] p-1">
      {(['attendance', 'progress', 'task'] as TabId[]).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(t)}
          className={`rounded-lg px-6 py-2 text-sm capitalize transition-all cursor-pointer ${
            tab === t ? 'bg-white font-semibold text-[#17324D] shadow-sm' : 'font-medium text-gray-500 hover:text-[#17324D]'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
