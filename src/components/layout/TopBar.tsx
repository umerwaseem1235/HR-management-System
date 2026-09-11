'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Bell, ChevronDown, User, Settings, LogOut, CalendarDays, CheckCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { ROLE_LABELS } from '../../lib/constants';

interface TopBarProps {
  onMenuClick: () => void;
  title?: string;
}

export default function TopBar({ onMenuClick, title }: TopBarProps) {
  const { user, logout } = useAuth();
  const { notifications, markAsRead } = useNotifications();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-600';
      case 'warning': return 'bg-yellow-100 text-yellow-600';
      case 'error': return 'bg-red-100 text-red-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#D6E4E8]/70 bg-white/85 backdrop-blur-xl shadow-[0_4px_24px_-12px_rgba(23,50,77,0.25)]">
      <div className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6">
        {/* Left: Menu + Title */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-xl p-2 text-[#263238] transition-all hover:bg-[#EAF2F4] hover:text-[#0F8B8D] active:scale-95 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          {title && (
            <div className="hidden min-w-0 sm:block">
              <h2 className="truncate text-lg font-bold tracking-tight text-[#17324D]">{title}</h2>
              <div className="mt-0.5 h-0.5 w-8 rounded-full bg-gradient-to-r from-[#0F8B8D] to-[#0F8B8D]/10" />
            </div>
          )}
          <span className="hidden items-center gap-1.5 rounded-full border border-[#D6E4E8] bg-[#F8FBFC] px-3 py-1 text-xs font-medium text-gray-500 xl:inline-flex">
            <CalendarDays size={13} className="text-[#0F8B8D]" />
            {todayLabel}
          </span>
        </div>

        {/* Center: Search */}
        <div className="hidden max-w-md flex-1 md:block">
          <div className="group relative transition-all focus-within:-translate-y-px">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#0F8B8D]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employees, documents..."
              className="w-full rounded-xl border border-transparent bg-[#EAF2F4]/70 py-2.5 pl-10 pr-4 text-sm text-[#263238] placeholder-gray-400 shadow-inner outline-none transition-all focus:border-[#0F8B8D]/40 focus:bg-white focus:shadow-[0_0_0_4px_rgba(15,139,141,0.12)]"
            />
          </div>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
              className={`relative rounded-xl p-2.5 transition-all active:scale-95 ${showNotifications ? 'bg-[#EAF2F4] text-[#0F8B8D]' : 'text-[#263238] hover:bg-[#EAF2F4] hover:text-[#0F8B8D]'}`}
              aria-label="Notifications"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center px-1">
                  <span className="animate-ping-soft absolute inline-flex h-full w-full rounded-full bg-red-400" />
                  <span className="relative inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 px-1 text-[10px] font-bold text-white shadow-sm">
                    {unreadCount}
                  </span>
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="animate-dropdown-in absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[#D6E4E8] bg-white shadow-2xl shadow-[#17324D]/15">
                <div className="bg-gradient-to-r from-[#17324D] to-[#0F8B8D] px-4 py-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">Notifications</h3>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white">
                      {unreadCount} unread
                    </span>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.slice(0, 5).map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => { markAsRead(notif.id); setShowNotifications(false); if (notif.link) router.push(notif.link); }}
                      className={`cursor-pointer border-b border-[#D6E4E8]/60 p-4 transition-colors last:border-0 hover:bg-[#EAF2F4]/60 ${!notif.read ? 'bg-[#EAF2F4]/40' : ''}`}
                    >
                      <div className="flex gap-3">
                        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl shadow-sm ${getNotificationIcon(notif.type)}`}>
                          <Bell size={15} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[#263238]">{notif.title}</p>
                            {!notif.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#0F8B8D]" />}
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{notif.message}</p>
                          <p className="mt-1 text-[10px] text-gray-400">{new Date(notif.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 border-t border-[#D6E4E8]/60 bg-[#F8FBFC] p-2.5">
                  <button
                    onClick={() => { setShowNotifications(false); router.push('/notifications'); }}
                    className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#0F8B8D] transition-colors hover:bg-[#EAF2F4]"
                  >
                    View All
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={() => notifications.filter(n => !n.read).forEach(n => markAsRead(n.id))}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-[#EAF2F4] hover:text-[#263238]"
                    >
                      <CheckCheck size={14} /> Mark read
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="mx-1 hidden h-8 w-px bg-[#D6E4E8] sm:block" />

          {/* User Menu */}
          <div ref={userRef} className="relative">
            <button
              onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              className={`flex items-center gap-2.5 rounded-xl p-1.5 pr-2.5 transition-all active:scale-[0.98] sm:pr-3 ${showUserMenu ? 'bg-[#EAF2F4]' : 'hover:bg-[#EAF2F4]'}`}
            >
              <span className="relative">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#0F8B8D] to-[#17324D] text-xs font-bold text-white shadow-md shadow-[#0F8B8D]/30 ring-2 ring-white">
                  {user.avatar || user.name.split(' ').map(n => n[0]).join('')}
                </span>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
              </span>
              <span className="hidden text-left sm:block">
                <p className="text-sm font-semibold leading-tight text-[#263238]">{user.name}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">{ROLE_LABELS[user.role]}</p>
              </span>
              <ChevronDown size={15} className={`hidden text-gray-400 transition-transform duration-200 sm:block ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {showUserMenu && (
              <div className="animate-dropdown-in absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-[#D6E4E8] bg-white p-1.5 shadow-2xl shadow-[#17324D]/15">
                <div className="rounded-xl bg-[#F8FBFC] px-3.5 py-3">
                  <p className="truncate text-sm font-semibold text-[#263238]">{user.name}</p>
                  <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
                </div>
                <button
                  onClick={() => { setShowUserMenu(false); router.push('/profile'); }}
                  className="mt-1 flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#263238] transition-colors hover:bg-[#EAF2F4]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF2F4] text-[#0F8B8D]">
                    <User size={15} />
                  </span>
                  My Profile
                </button>
                <button
                  onClick={() => { setShowUserMenu(false); router.push('/settings'); }}
                  className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#263238] transition-colors hover:bg-[#EAF2F4]"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                    <Settings size={15} />
                  </span>
                  Settings
                </button>
                <div className="my-1.5 border-t border-[#D6E4E8]/60" />
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <LogOut size={15} />
                  </span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
