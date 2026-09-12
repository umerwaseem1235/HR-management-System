'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useAuth } from '../../contexts/AuthContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/recruitment': 'Recruitment',
  '/attendance': 'Attendance',
  '/leave': 'Leave Management',
  '/payroll': 'Payroll',
  '/performance': 'Performance',
  '/expenses': 'Expenses',
  '/documents': 'Documents',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/profile': 'My Profile',
  '/notifications': 'Notifications',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarLocked, setSidebarLocked] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EAF2F4]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#024fa7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#17324D] font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const pageTitle = Object.entries(PAGE_TITLES).find(([path]) => pathname.startsWith(path))?.[1] || '';

  return (
    <div className="flex min-h-screen bg-[#EAF2F4]">
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        hoverLock={sidebarLocked}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          title={pageTitle}
          sidebarLocked={sidebarLocked}
          onToggleSidebarLock={() => setSidebarLocked((v) => !v)}
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
