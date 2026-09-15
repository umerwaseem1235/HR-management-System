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
      className={`relative rounded-xl p-2.5 transition-all active:scale-95 ${open ? 'bg-[#EAF2F4] text-[#024fa7]' : 'text-[#263238] hover:bg-[#EAF2F4] hover:text-[#024fa7]'}`}
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
  );
}

export default NotificationBell;
