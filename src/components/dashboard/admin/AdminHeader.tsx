'use client';

import { CalendarDays } from 'lucide-react';
import type { ReactNode } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminHeaderProps {
  welcomeName: string;
  todayLabel: string;
  actions?: ReactNode;
}

export default function AdminHeader({ welcomeName, todayLabel, actions }: AdminHeaderProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500 dark:text-gray-400">
          <CalendarDays size={14} className="text-teal" aria-hidden="true" />
          {todayLabel}
        </p>
        <h1 className="text-lg font-bold leading-tight tracking-tight text-primary dark:text-blue-gray-light sm:text-xl">
          {t('dashboard.welcome')}, {welcomeName}!
        </h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
