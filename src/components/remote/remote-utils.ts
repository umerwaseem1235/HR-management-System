'use client';

import React from 'react';
import Badge from '../ui/Badge';
import type { RemoteRequest } from '../../lib/types';

export function diffInDaysInclusive(start: string, end: string): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return null;
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

export function formatRange(from: string, to: string): string {
  if (!from) return '—';
  if (!to || to === from) return from;
  return `${from} → ${to}`;
}

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Cancelled', label: 'Cancelled' },
];

export const PER_PAGE_OPTIONS = [
  { value: '5', label: '5' },
  { value: '10', label: '10' },
  { value: '20', label: '20' },
];

export function StatusBadge({ status }: { status: RemoteRequest['status'] }) {
  const map: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
    Pending: 'warning',
    Approved: 'success',
    Rejected: 'danger',
    Cancelled: 'neutral',
  };
  return React.createElement(Badge, { variant: map[status] || 'neutral', children: status });
}
