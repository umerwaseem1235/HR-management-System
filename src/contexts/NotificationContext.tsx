'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
import { Notification } from '../lib/types';
import { getNotifications, markAsRead as markAsReadAction, markAllAsRead as markAllAsReadAction, createNotification as createNotificationAction } from '@/lib/actions/notifications';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (input: { title: string; message: string; type?: Notification['type']; link?: string; userId?: string }) => Promise<void>;
  refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    setIsLoading(true);
    try {
      const data = await getNotifications(user.id);
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    await markAsReadAction(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    await markAllAsReadAction(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, [user?.id]);

  const addNotification = useCallback(async (input: { title: string; message: string; type?: Notification['type']; link?: string; userId?: string }) => {
    const targetUserId = input.userId || user?.id;
    const n = await createNotificationAction({
      userId: targetUserId,
      title: input.title,
      message: input.message,
      type: input.type,
      link: input.link
    });
    // Only update local state if it's meant for the current user
    if (targetUserId === user?.id) {
      setNotifications((prev) => [n, ...prev]);
    }
  }, [user?.id]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      markAsRead,
      markAllAsRead,
      addNotification,
      refresh: fetchNotifications,
    }),
    [notifications, unreadCount, isLoading, markAsRead, markAllAsRead, addNotification, fetchNotifications]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
