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
    <div className="animate-dropdown-in absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-medium-gray bg-white dark:bg-[#1b263b] shadow-2xl shadow-primary/15">
      <div className="bg-gradient-to-r from-primary to-teal px-4 py-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-white">Notifications</h3>
          <span className="rounded-full bg-white dark:bg-[#1b263b]/20 px-2 py-0.5 text-[11px] font-semibold text-white">
            {unreadCount} unread
          </span>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.slice(0, 5).map(notif => (
          <div
            key={notif.id}
            onClick={() => onSelect(notif)}
            className={`cursor-pointer border-b border-medium-gray/60 p-4 transition-colors last:border-0 hover:bg-blue-gray dark:hover:bg-white/10/60 ${!notif.read ? 'bg-blue-gray/40' : ''}`}
          >
            <div className="flex gap-3">
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl shadow-sm ${getNotificationIcon(notif.type)}`}>
                <Bell size={15} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-dark-text dark:text-gray-100">{notif.title}</p>
                  {!notif.read && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-teal" />}
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{notif.message}</p>
                <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">{new Date(notif.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-medium-gray/60 bg-blue-gray-light p-2.5">
        <button
          onClick={onViewAll}
          className="flex-1 rounded-lg px-3 py-1.5 text-sm font-semibold text-teal transition-colors hover:bg-blue-gray dark:hover:bg-white/10"
        >
          View All
        </button>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 transition-colors hover:bg-blue-gray dark:hover:bg-white/10 hover:text-dark-text dark:text-gray-100"
          >
            <CheckCheck size={14} /> Mark read
          </button>
        )}
      </div>
    </div>
  );
}

export default NotificationDropdown;
