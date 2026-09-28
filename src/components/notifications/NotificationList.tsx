'use client';

import React from 'react';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import { Bell } from 'lucide-react';
import type { Notification } from '../../lib/types';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'success': return 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400';
    case 'warning': return 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400';
    case 'error': return 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400';
    default: return 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400';
  }
}

export function NotificationItem({ notif, onOpen }: { notif: Notification; onOpen: (id: string, link?: string) => void }) {
  return (
    <button
      onClick={() => onOpen(notif.id, notif.link)}
      className={`w-full text-left p-4 rounded-lg border border-medium-gray hover:bg-blue-gray dark:hover:bg-white/10/50 transition-colors ${!notif.read ? 'bg-blue-gray/30' : 'bg-white dark:bg-[#1b263b]'}`}
    >
      <div className="flex gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationIcon(notif.type)}`}>
          <Bell size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-dark-text dark:text-gray-100">{notif.title}</p>
            {!notif.read && <Badge variant="info" size="sm">New</Badge>}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-0.5">{notif.message}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {new Date(notif.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    </button>
  );
}

interface NotificationListProps {
  notifications: Notification[];
  activeTab: string;
  onOpen: (id: string, link?: string) => void;
}

export default function NotificationList({ notifications, activeTab, onOpen }: NotificationListProps) {
  if (notifications.length === 0) {
    return (
      <EmptyState
        title={activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
        description={activeTab === 'unread' ? 'You are all caught up.' : 'Notifications will appear here.'}
      />
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notif) => (
        <NotificationItem key={notif.id} notif={notif} onOpen={onOpen} />
      ))}
    </div>
  );
}
