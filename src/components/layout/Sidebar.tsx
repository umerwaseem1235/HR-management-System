'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, UserPlus, Clock, CalendarDays, Wallet,
  TrendingUp, Receipt, FileText, BarChart3, Settings, ChevronLeft,
  ChevronRight, LogOut, Building2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NAVIGATION, ROLE_LABELS } from '../../lib/constants';

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Users, UserPlus, Clock, CalendarDays, Wallet,
  TrendingUp, Receipt, FileText, BarChart3, Settings,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (!user) return null;

  const filteredNav = NAVIGATION.filter(item => item.roles.includes(user.role));

  const sidebarContent = (
    <div className={`relative flex h-full flex-col overflow-hidden bg-gradient-to-b from-[#1a3a5c] via-[#17324D] to-[#0d1f33] text-white shadow-2xl shadow-[#0d1f33]/40 transition-all duration-300 ${collapsed ? 'w-[76px]' : 'w-[264px]'}`}>
      {/* Decorative glows */}
      <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-[#0F8B8D]/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-10 -left-20 h-40 w-40 rounded-full bg-[#0F8B8D]/15 blur-3xl" />
      {/* Top accent line */}
      <div className="h-1 w-full flex-shrink-0 bg-gradient-to-r from-[#0F8B8D] via-[#2dd4bf] to-[#0F8B8D]" />

      {/* Logo */}
      <div className="flex h-16 flex-shrink-0 items-center px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0F8B8D] to-[#14b8a6] shadow-lg shadow-[#0F8B8D]/40 ring-1 ring-white/25">
            <Building2 size={20} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="truncate text-base font-extrabold tracking-tight">CodeQor</h1>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5eead4]/80">HRMS</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {!collapsed && (
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Main Menu</p>
        )}
        {filteredNav.map(item => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-[#0F8B8D] to-[#14a8a0] text-white shadow-lg shadow-[#0F8B8D]/30'
                  : 'text-white/60 hover:translate-x-0.5 hover:bg-white/10 hover:text-white'
              }`}
              title={collapsed ? item.name : undefined}
            >
              {isActive && (
                <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-[#5eead4]" />
              )}
              <Icon size={20} className={`flex-shrink-0 transition-transform duration-200 ${isActive ? 'drop-shadow' : 'group-hover:scale-110'}`} />
              {!collapsed && <span className="truncate">{item.name}</span>}
              {!collapsed && item.badge && item.badge > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 px-1.5 text-[11px] font-bold text-white shadow-sm ring-1 ring-white/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="hidden px-3 py-2 lg:block">
        <button
          onClick={onToggle}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/50 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span className="text-xs font-medium">Collapse</span></>}
        </button>
      </div>

      {/* User profile */}
      <div className="flex-shrink-0 p-3">
        <div className={`rounded-2xl border border-white/15 bg-white/10 p-3 shadow-inner backdrop-blur-sm ${collapsed ? 'flex justify-center' : ''}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <span className="relative flex-shrink-0">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0F8B8D] to-[#14b8a6] text-sm font-bold shadow-md ring-2 ring-white/30">
                {user.avatar || user.name.split(' ').map(n => n[0]).join('')}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#17324D] bg-green-400" />
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{user.name}</p>
                <p className="text-[11px] text-white/50">{ROLE_LABELS[user.role]}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={logout}
                className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-red-500/20 hover:text-red-300"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={onMobileClose} />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:hidden ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {React.cloneElement(sidebarContent as React.ReactElement, {})}
      </div>

      {/* Desktop sidebar */}
      <div className="sticky top-0 hidden h-screen lg:block">
        {sidebarContent}
      </div>
    </>
  );
}
