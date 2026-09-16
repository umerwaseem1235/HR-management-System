'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { PremiumIcon, iconThemes } from './StatIcon';
import type { StatIconName } from './StatIcon';

export type { StatIconName };
export { PremiumIcon, iconThemes };

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  iconName?: StatIconName;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  iconBg?: string;
  iconColor?: string;
}

// Shared card hover language lives in globals.css (.card-hover, 300ms ease-in-out).
// StatCard keeps its decorative glow, retimed to the same curve.

export default function StatCard({
  title,
  value,
  icon,
  iconName,
  change,
  changeType = 'neutral',
  iconBg,
  iconColor
}: StatCardProps) {
  const changeStyles = {
    positive: 'bg-green-50 text-green-700 ring-green-600/20',
    negative: 'bg-red-50 text-red-600 ring-red-600/20',
    neutral: 'bg-gray-100 text-gray-500 ring-gray-500/10',
  };

  const dotStyles = {
    positive: 'bg-green-500',
    negative: 'bg-red-500',
    neutral: 'bg-gray-400',
  };

  const theme = iconName ? iconThemes[iconName] : undefined;
  const bgClass = iconBg ?? theme?.bg ?? 'bg-gradient-to-br from-[#EAF2F4] to-[#D6E4E8]';
  const displayIcon = icon ?? (iconName ? <PremiumIcon name={iconName} size={18} color={iconColor} /> : <Users size={18} className="text-[#024fa7]" />);

  return (
    <div className="group relative h-full min-w-0 overflow-hidden rounded-2xl border border-[#D6E4E8]/70 bg-white p-2.5 xl:p-4 2xl:p-5 shadow-[0_1px_2px_rgba(23,50,77,0.05),0_10px_30px_-14px_rgba(23,50,77,0.18)] card-hover">
      {/* Decorative ambient glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-[#024fa7]/14 via-transparent to-transparent opacity-60 group-hover:scale-130 group-hover:opacity-100 transition-all duration-300 ease-in-out" />

      <div className="relative flex items-start justify-between gap-1.5 xl:gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate whitespace-nowrap text-[9px] lg:text-[10px] xl:text-xs font-medium text-gray-500 tracking-normal xl:tracking-wide" title={title}>{title}</p>
          <p className="mt-1.5 text-lg xl:text-xl 2xl:text-2xl font-bold leading-none tracking-tight text-[#17324D]">{value}</p>
          {change && (
            <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset ${changeStyles[changeType]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[changeType]}`} />
              {change}
            </span>
          )}
        </div>
        <div className={`${bgClass} relative shrink-0 rounded-xl xl:rounded-2xl p-1.5 xl:p-2.5 shadow-md ring-1 ring-black/5 group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-300 ease-in-out`}>
          <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 card-hover-fade" />
          <div className="relative">{displayIcon}</div>
        </div>
      </div>
    </div>
  );
}
