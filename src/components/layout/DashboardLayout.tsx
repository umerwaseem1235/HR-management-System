'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { AuthLoadingView } from './AuthLoadingView';
import { useAuthRedirect } from './useAuthRedirect';
import { PAGE_TITLES } from './page-titles';
import { warmAttendanceCache } from '@/features/attendance/hooks/useAttendance';
import { warmPayrollCache } from '@/features/payroll/hooks/usePayroll';
import { warmDocumentsCache } from '@/features/documents/hooks/useDocuments';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthRedirect();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Warm sibling module caches during dashboard idle time so switching
  // modules later paints instantly. Runs once after the first paint.
  useEffect(() => {
    const id = requestIdleCallback?.(
      () => {
        warmAttendanceCache();
        warmPayrollCache();
        warmDocumentsCache();
      },
      { timeout: 5000 },
    );
    return () => { if (id) cancelIdleCallback(id); };
  }, []);

  if (isLoading) {
    return <AuthLoadingView />;
  }

  if (!isAuthenticated) return null;

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] || '';

  return (
    <div className="flex min-h-screen bg-[#EAF2F4]">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          title={pageTitle}
        />
        <main className="relative flex-1 p-4 lg:p-6 overflow-auto">
          {/* Subtle premium background wash */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-[#024fa7]/[0.06] via-[#024fa7]/[0.02] to-transparent" />
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
