'use client';

import React from 'react';

interface PageHeaderProps {
  title: string;
  actions?: React.ReactNode;
}

/**
 * Shared premium page header: main title only, with an optional
 * right-aligned actions slot. Title typography matches
 * the superadmin dashboard "Welcome back" heading (text-2xl font-bold).
 */
export default function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold leading-tight tracking-tight text-[#17324D]">
          {title}
        </h1>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
