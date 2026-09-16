'use client';

import React from 'react';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import { Bell } from 'lucide-react';
import type { Notification } from '../../lib/types';

function getNotificationIcon(type: string) {
  switch (type) {
    case 'success': return 'bg-green-100 text-green-600';
    case 'warning': return 'bg-yellow-100 text-yellow-600';
    case 'error': return 'bg-red-100 text-red-600';
    default: return 'bg-blue-100 text-blue-600';
  }
}

export function NotificationItem({ notif, onOpen }: { notif: Notification; onOpen: (id: string, link?: string) => void }) {
  return (
    <button
      onClick={() => onOpen(notif.id, notif.link)}
      className={`w-full text-left p-4 rounded-lg border border-[#D6E4E8] hover:bg-[#EAF2F4]/50 transition-colors ${!notif.read ? 'bg-[#EAF2F4]/30' : 'bg-white'}`}
    >
      <div className="flex gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationIcon(notif.type)}`}>
          <Bell size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-[#263238]">{notif.title}</p>
            {!notif.read && <Badge variant="info" size="sm">New</Badge>}
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{notif.message}</p>
          <p className="text-xs text-gray-400 mt-1">
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
