'use client';

import React from 'react';
import { type LucideIcon } from 'lucide-react';

export function FieldRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="flex min-w-0 shrink-0 items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal/10 text-teal">
          <Icon size={17} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500 whitespace-nowrap">
          {label}
        </span>
      </div>
      <span className="min-w-0 text-right text-sm font-semibold text-primary dark:text-blue-gray-light break-words">
        {value || '—'}
      </span>
    </div>
  );
}

interface ProfileInfoProps {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}

export default function ProfileInfo({ icon, title, children }: ProfileInfoProps) {
  return (
    <div className="px-5 sm:px-6 pb-5 sm:pb-6">
      <div className="rounded-xl border border-medium-gray/70 bg-blue-gray-light/70 px-1 py-1">
        <div className="flex items-center gap-2 px-3 pt-2.5 pb-1">
          {React.createElement(icon, { size: 16, className: 'text-teal' })}
          <h2 className="text-sm font-bold text-primary dark:text-blue-gray-light">{title}</h2>
        </div>
        <div className="divide-y divide-medium-gray/60">{children}</div>
      </div>
    </div>
  );
}
