'use client';

import React from 'react';
import Badge from '../ui/Badge';

/**
 * Canonical status -> Badge variant mapping.
 * Replaces the copy-pasted `statusBadge()` helpers in every page.
 */
const STATUS_VARIANTS: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = {
  Active: 'success',
  Present: 'success',
  Approved: 'success',
  Available: 'success',
  Completed: 'success',
  Finalized: 'success',
  Hired: 'success',
  Selected: 'success',
  Reimbursed: 'success',
  Open: 'success',
  Submitted: 'success',
  Inactive: 'danger',
  Absent: 'danger',
  Rejected: 'danger',
  Failed: 'danger',
  'On Notice': 'warning',
  Late: 'warning',
  Pending: 'warning',
  Draft: 'warning',
  'Half Day': 'warning',
  'On Hold': 'warning',
  'In Progress': 'warning',
  'Needs Revision': 'warning',
  Leave: 'info',
  Probation: 'info',
  Processed: 'info',
  Reviewed: 'info',
  Interview: 'info',
  Screening: 'info',
  Offer: 'info',
  Applied: 'info',
};

interface StatusBadgeProps {
  status: string;
  children?: React.ReactNode;
}

export default function StatusBadge({ status, children }: StatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status] || 'neutral'}>{children ?? status}</Badge>;
}
