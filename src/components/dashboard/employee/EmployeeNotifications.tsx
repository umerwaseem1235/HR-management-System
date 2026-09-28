'use client';

import Link from 'next/link';
import Card from '../../ui/Card';
import type { Notification } from '../dashboard-types';

export default function EmployeeNotifications({ notifications }: { notifications: Notification[] }) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-primary dark:text-blue-gray-light">Notifications</h3>
        <Link href="/notifications" className="text-sm text-teal hover:underline font-medium">View All</Link>
      </div>
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 text-center py-4">No new notifications</p>
        ) : (
          notifications.map(notif => (
            <div key={notif.id} className="p-3 rounded-lg bg-blue-gray/50 border border-medium-gray">
              <p className="text-sm font-medium text-dark-text dark:text-gray-100">{notif.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{notif.message}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleDateString()}</p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
