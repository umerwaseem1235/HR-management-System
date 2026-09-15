export type { LeaveBalance, LeaveRequest } from '@/types';

export interface LeaveEditFormState {
  type: string;
  start: string;
  end: string;
  reason: string;
  errors: Record<string, string>;
}

export interface BalanceEditFormState {
  type: string;
  total: string;
  errors: Record<string, string>;
}
