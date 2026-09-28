'use client';

import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  unreadCount: number;
  open: boolean;
  onToggle: () => void;
}

export function NotificationBell({ unreadCount, open, onToggle }: NotificationBellProps) {
  return (
    <button
      onClick={onToggle}
      className={`relative rounded-xl p-2.5 transition-all active:scale-95 ${open ? 'bg-blue-gray text-teal' : 'text-dark-text dark:text-gray-100 hover:bg-blue-gray dark:hover:bg-white/10 hover:text-teal'}`}
      aria-label="Notifications"
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="pointer-events-none absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 px-1 text-[10px] font-bold tabular-nums leading-none text-white shadow-sm ring-1 ring-white"
              style={{
                fontVariantNumeric: 'tabular-nums',
                textRendering: 'optimizeLegibility',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
              }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

export default NotificationBell;
