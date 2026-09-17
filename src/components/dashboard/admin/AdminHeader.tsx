'use client';

import { CalendarDays } from 'lucide-react';

interface AdminHeaderProps {
  welcomeName: string;
  todayLabel: string;
}

export default function AdminHeader({ welcomeName, todayLabel }: AdminHeaderProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
        <CalendarDays size={14} className="text-[#024fa7]" aria-hidden="true" />
        {todayLabel}
      </p>
      <h1 className="text-xl font-bold leading-tight tracking-tight text-[#17324D] sm:text-2xl">
        Welcome back, {welcomeName}!
      </h1>
    </div>
  );
}
