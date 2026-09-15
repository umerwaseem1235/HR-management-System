'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { CheckCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRequireAuth, AuthLoadingFallback } from '../../components/auth/RequireAuth';
import { useNotifications } from '../../contexts/NotificationContext';
import NotificationList from '../../components/notifications/NotificationList';
import NotificationFilters from '../../components/notifications/NotificationFilters';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');

  useRequireAuth();
  if (!user) return <AuthLoadingFallback />;

  const tabs = [
    { id: 'all', label: 'All', count: notifications.length },
    { id: 'unread', label: 'Unread', count: unreadCount },
  ];

  const visible = activeTab === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  const handleOpen = (id: string, link?: string) => {
    markAsRead(id);
    if (link) router.push(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 text-sm text-[#024fa7] hover:underline font-medium"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <PageHeader
          title="Notifications"
          actions={unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck size={16} /> Mark all as read
            </Button>
          )}
        />

        <Card padding="none">
          <NotificationFilters tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="p-6">
            <NotificationList notifications={visible} activeTab={activeTab} onOpen={handleOpen} />
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
