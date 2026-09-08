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
    <div className={`flex flex-col h-full bg-[#17324D] text-white transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[260px]'}`}>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-[#0F8B8D] rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 size={20} className="text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-bold truncate">CodeQor</h1>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">HRMS</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {filteredNav.map(item => {
          const Icon = iconMap[item.icon] || LayoutDashboard;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? 'bg-[#0F8B8D] text-white shadow-lg shadow-[#0F8B8D]/20'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
              title={collapsed ? item.name : undefined}
            >
              <Icon size={20} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
              {!collapsed && item.badge && item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-2 hidden lg:block">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors text-sm"
        >
          {collapsed ? <ChevronRight size={18} /> : <><ChevronLeft size={18} /><span>Collapse</span></>}
        </button>
      </div>

      {/* User profile */}
      <div className="border-t border-white/10 p-3">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="w-9 h-9 rounded-full bg-[#0F8B8D] flex items-center justify-center flex-shrink-0 text-sm font-semibold">
            {user.avatar || user.name.split(' ').map(n => n[0]).join('')}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-white/50">{ROLE_LABELS[user.role]}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onMobileClose} />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-300 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {React.cloneElement(sidebarContent as React.ReactElement, {})}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:block h-screen sticky top-0">
        {sidebarContent}
      </div>
    </>
  );
}
