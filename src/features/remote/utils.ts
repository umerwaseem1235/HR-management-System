import { todayStr } from '@/utils/date';

// Canonical date-range helper lives in @/utils — re-exported here so existing
// `from '@/features/remote'` imports keep working.
export { diffInDaysInclusive } from '@/utils/date';

export const PAST_DATE_ERROR = 'Please choose a date from today onward.';

export function isPastDate(dateValue: string): boolean {
  if (!dateValue) return false;
  return dateValue < todayStr();
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
