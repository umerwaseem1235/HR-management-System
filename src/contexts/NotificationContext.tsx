'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Notification } from '../lib/types';
import { mockNotifications } from '../lib/mock-data';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'hrms_notifications';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  // Load persisted read states after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const readById: Record<string, boolean> = JSON.parse(stored);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: readById[n.id] ?? n.read })));
      }
    } catch {
      // Corrupt storage — keep mock defaults
    }
  }, []);

  // Persist read states so they survive reloads
  useEffect(() => {
    try {
      const readById: Record<string, boolean> = {};
      notifications.forEach((n) => { readById[n.id] = n.read; });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readById));
    } catch {
      // Storage unavailable — ignore
    }
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount: notifications.filter((n) => !n.read).length, markAsRead, markAllAsRead }}
    >
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
