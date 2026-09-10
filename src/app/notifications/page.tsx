'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { Bell, CheckCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  if (!user) return null;

  const tabs = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
  ];

  const visible = activeTab === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-600';
      case 'warning': return 'bg-yellow-100 text-yellow-600';
      case 'error': return 'bg-red-100 text-red-600';
      default: return 'bg-blue-100 text-blue-600';
    }
  };

  const handleOpen = (id: string, link?: string) => {
    markAsRead(id);
    if (link) router.push(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
<<<<<<< HEAD
        <PageHeader
          eyebrow="Inbox"
          title="Notifications"
          subtitle={`${unreadCount} unread`}
          actions={unreadCount > 0 && (
=======
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 text-sm text-[#0F8B8D] hover:underline font-medium"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#17324D]">Notifications</h1>
            <p className="text-sm text-gray-500 mt-1">{unreadCount} unread</p>
          </div>
          {unreadCount > 0 && (
>>>>>>> 6ff1bc73192253d7a7a3e072d3fdec900b0db3e5
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck size={16} /> Mark all as read
            </Button>
          )}
        />

        <Card padding="none">
          <div className="px-6 pt-4">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>
          <div className="p-6">
            {visible.length === 0 ? (
              <EmptyState
                title={activeTab === 'unread' ? 'No unread notifications' : 'No notifications'}
                description={activeTab === 'unread' ? 'You are all caught up.' : 'Notifications will appear here.'}
              />
            ) : (
              <div className="space-y-3">
                {visible.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => handleOpen(notif.id, notif.link)}
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
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
