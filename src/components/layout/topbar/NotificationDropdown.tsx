'use client';

import React from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import type { Notification } from '../../../lib/types';
import { getNotificationIcon } from './notification-icon';

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onSelect: (notif: Notification) => void;
  onViewAll: () => void;
  onMarkAllRead: () => void;
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onSelect,
  onViewAll,
  onMarkAllRead,
}: NotificationDropdownProps) {
  return (
    <div className="animate-dropdown-in absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-[#D6E4E8] bg-white shadow-2xl shadow-[#17324D]/15">
      <div className="bg-gradient-to-r from-[#17324D] to-[#024fa7] px-4 py-3.5">
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
            onClick={() => onSelect(notif)}
            className={`cursor-pointer border-b border-[#D6E4E8]/60 p-4 transition-colors last:border-0 hover:bg-[#EAF2F4]/60 ${!notif.read ? 'bg-[#EAF2F4]/40' : ''}`}
          >
            <div className="flex gap-3">
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl shadow-sm ${getNotificationIcon(notif.type)}`}>
                <Bell size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#263238]">{notif.title}</p>
                  {!notif.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-[#024fa7]" />}
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
          onClick={onViewAll}
          className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-[#024fa7] transition-colors hover:bg-[#EAF2F4]"
        >
          View All
        </button>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-[#EAF2F4] hover:text-[#263238]"
          >
            <CheckCheck size={14} /> Mark read
          </button>
        )}
      </div>
    </div>
  );
}

export default NotificationDropdown;
