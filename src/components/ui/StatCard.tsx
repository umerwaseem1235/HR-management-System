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
  showDot?: boolean;
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
  showDot = true,
  iconBg,
  iconColor
}: StatCardProps) {
  const changeStyles = {
    positive: 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 ring-green-600/20',
    negative: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 ring-red-600/20',
    neutral: 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 dark:text-gray-500 ring-gray-500/10',
  };

  const dotStyles = {
    positive: 'bg-green-50 dark:bg-green-950/300',
    negative: 'bg-red-50 dark:bg-red-950/300',
    neutral: 'bg-gray-400',
  };

  const theme = iconName ? iconThemes[iconName] : undefined;
  const bgClass = iconBg ?? theme?.bg ?? 'bg-gradient-to-br from-blue-gray to-medium-gray';
  const displayIcon = icon ?? (iconName ? <PremiumIcon name={iconName} size={18} color={iconColor} /> : <Users size={18} className="text-teal" />);

  return (
    <div className="group relative h-full min-w-0 overflow-hidden rounded-2xl border border-medium-gray/70 bg-white dark:bg-[#1b263b] p-3 sm:p-2.5 xl:p-4 2xl:p-5 shadow-[0_1px_2px_rgba(23,50,77,0.05),0_10px_30px_-14px_rgba(23,50,77,0.18)] card-hover">
      {/* Decorative ambient glow */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-teal/14 via-transparent to-transparent opacity-60 group-hover:scale-130 group-hover:opacity-100 transition-all duration-300 ease-in-out" />

      <div className="relative flex items-start justify-between gap-1.5 xl:gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate whitespace-nowrap text-[10px] xl:text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 tracking-normal xl:tracking-wide" title={title}>{title}</p>
          <p className="mt-1.5 break-words text-base sm:text-lg xl:text-xl 2xl:text-2xl font-bold leading-tight tracking-tight text-primary dark:text-blue-gray-light">{value}</p>
          {change && (
            <span className={`mt-2 sm:mt-3 inline-flex max-w-full items-center gap-1.5 truncate rounded-full px-2 sm:px-3 py-1 text-[10px] sm:text-[11px] font-semibold ring-1 ring-inset ${changeStyles[changeType]}`}>
              {showDot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotStyles[changeType]}`} />}
              <span className="truncate">{change}</span>
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
