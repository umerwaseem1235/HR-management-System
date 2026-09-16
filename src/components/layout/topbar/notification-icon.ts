"use client";

export function getNotificationIcon(type: string): string {
  switch (type) {
    case 'success': return 'bg-green-100 text-green-600';
    case 'warning': return 'bg-yellow-100 text-yellow-600';
    case 'error': return 'bg-red-100 text-red-600';
    default: return 'bg-blue-100 text-blue-600';
  }
}

export default getNotificationIcon;
