'use client';

import React from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/**
 * Shared premium page header: eyebrow label + solid navy title + subtitle,
 * with an optional right-aligned actions slot. Matches the dashboard
 * "Admin Overview" heading language used across the app.
 */
export default function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#0F8B8D]">{eyebrow}</p>
        )}
        <h1 className="mt-1.5 text-[26px] font-extrabold leading-tight tracking-tight text-[#17324D]">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
