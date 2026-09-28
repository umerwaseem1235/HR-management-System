"use client";

export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'success': return 'bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400';
    case 'warning': return 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-600 dark:text-yellow-400';
    case 'error': return 'bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400';
    default: return 'bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400';
  }
}

export default getNotificationIcon;
