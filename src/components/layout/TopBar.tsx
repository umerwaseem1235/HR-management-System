'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import type { Notification } from '../../lib/types';
import { NotificationBell } from './topbar/NotificationBell';
import { NotificationDropdown } from './topbar/NotificationDropdown';
import { UserMenu } from './topbar/UserMenu';
import { useClickOutside } from '../../hooks/useClickOutside';

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
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  useClickOutside(notifRef, () => setShowNotifications(false));
  useClickOutside(userRef, () => setShowUserMenu(false));

  if (!user) return null;

  const handleSelectNotification = (notif: Notification) => {
    markAsRead(notif.id);
    setShowNotifications(false);
    if (notif.link) router.push(notif.link);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 shadow-[0_4px_24px_-12px_rgba(23,50,77,0.18)] backdrop-blur dark:border-white/10 dark:bg-[#0f1b2e]/95 dark:shadow-black/30">
      <div className="flex flex-row rtl:flex-row-reverse h-16 items-center justify-between gap-3 px-4 lg:px-6">
        {/* Left: Title (mobile menu + title) */}
        <div className="flex flex-row rtl:flex-row-reverse min-w-0 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="rounded-xl p-2 text-dark-text dark:text-gray-100 transition-all hover:bg-blue-gray dark:hover:bg-white/10 hover:text-teal active:scale-95 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          {title && (
            <div className="hidden min-w-0 sm:block">
              <h2 className="truncate text-lg font-bold tracking-tight text-primary dark:text-slate-100">{title}</h2>
            </div>
          )}
        </div>

        {/* Right: Notifications + User */}
        <div className="flex flex-row rtl:flex-row-reverse items-center gap-1.5">
          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <NotificationBell
              unreadCount={unreadCount}
              open={showNotifications}
              onToggle={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            />

            {showNotifications && (
              <NotificationDropdown
                notifications={notifications}
                unreadCount={unreadCount}
                onSelect={handleSelectNotification}
                onViewAll={() => { setShowNotifications(false); router.push('/notifications'); }}
                onMarkAllRead={() => notifications.filter(n => !n.read).forEach(n => markAsRead(n.id))}
              />
            )}
          </div>

          <div className="mx-1 hidden h-8 w-px bg-medium-gray sm:block dark:bg-white/10" />

          {/* User Menu */}
          <div ref={userRef} className="relative">
            <UserMenu
              user={user}
              open={showUserMenu}
              onToggle={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
              onNavigate={(path) => { setShowUserMenu(false); router.push(path); }}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
