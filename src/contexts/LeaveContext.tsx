'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LeaveRequest, LeaveBalance } from '../lib/types';
import { LEAVE_TYPES } from '../lib/constants';
import { 
  getLeaveRequests, 
  getLeaveBalances, 
  createLeaveRequest, 
  updateLeaveStatus as updateLeaveStatusAction, 
  updateLeaveRequest as updateLeaveRequestAction, 
  deleteLeaveRequest as deleteLeaveRequestAction, 
  updateLeaveBalance as updateLeaveBalanceAction 
} from '@/lib/actions/leave';

const RETIRED_TYPE_MAP: Record<string, string> = {
  'Sick Leave': 'Monthly Leave',
  'Personal Leave': 'Monthly Leave',
  'Unpaid Leave': 'Monthly Leave',
};

function sanitizeRequests(requests: LeaveRequest[]): LeaveRequest[] {
  let changed = false;
  const next = requests.map((r) => {
    const mapped = RETIRED_TYPE_MAP[r.leaveType];
    if (mapped) {
      changed = true;
      return { ...r, leaveType: mapped };
    }
    return r;
  });
  return changed ? next : requests;
}

function sanitizeBalances(balances: LeaveBalance[]): LeaveBalance[] {
  const valid = new Set(LEAVE_TYPES.map((t) => t.name));
  const merged = new Map<string, LeaveBalance>();
  
  for (const b of balances) {
    const name = RETIRED_TYPE_MAP[b.leaveType] ?? b.leaveType;
    if (!valid.has(name)) continue;
    const prev = merged.get(name);
    if (prev) {
      const used = prev.used + b.used;
      const total = Math.max(prev.total, b.total);
      merged.set(name, {
        ...prev,
        total,
        used,
        remaining: Math.max(0, total - used),
        pending: prev.pending + b.pending,
      });
    } else {
      merged.set(name, { ...b, leaveType: name, remaining: Math.max(0, b.total - b.used) });
    }
  }
  
  for (const t of LEAVE_TYPES) {
    if (!merged.has(t.name)) {
      merged.set(t.name, { leaveType: t.name, total: t.daysAllowed, used: 0, remaining: t.daysAllowed, pending: 0 });
    }
  }
  return LEAVE_TYPES.map((t) => merged.get(t.name)!);
}

export interface NewLeaveInput {
  employeeId: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
}

interface LeaveContextType {
  leaveRequests: LeaveRequest[];
  leaveBalances: LeaveBalance[];
  isLoading: boolean;
  addLeaveRequest: (input: NewLeaveInput) => Promise<LeaveRequest>;
  updateLeaveStatus: (id: string, status: 'Approved' | 'Rejected', approvedBy?: string, comments?: string) => Promise<void>;
  updateLeaveRequest: (id: string, input: { leaveType: string; startDate: string; endDate: string; days: number; reason: string }) => Promise<void>;
  deleteLeaveRequest: (id: string) => Promise<void>;
  updateLeaveBalance: (leaveType: string, total: number, used: number) => void;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

export function LeaveProvider({ children }: { children: ReactNode }) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [requests, balances] = await Promise.all([
          getLeaveRequests(),
          getLeaveBalances()
        ]);
        setLeaveRequests(sanitizeRequests(requests));
        setLeaveBalances(sanitizeBalances(balances));
      } catch (error) {
        console.error('Failed to load leave data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const addLeaveRequest = async (input: NewLeaveInput): Promise<LeaveRequest> => {
    const request = await createLeaveRequest({
      employeeId: input.employeeId,
      leaveType: input.leaveType,
      startDate: input.startDate,
      endDate: input.endDate,
      days: input.days,
      reason: input.reason
    });
    setLeaveRequests((prev) => [request, ...prev]);
    return request;
  };

  const updateLeaveStatus = async (id: string, status: 'Approved' | 'Rejected', approvedBy?: string, comments?: string) => {
    await updateLeaveStatusAction(id, status, approvedBy, comments);
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, approvedBy, comments } : r))
    );
  };

  const updateLeaveRequest = async (id: string, input: { leaveType: string; startDate: string; endDate: string; days: number; reason: string }) => {
    await updateLeaveRequestAction(id, input);
    setLeaveRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...input } : r)));
  };

  const deleteLeaveRequest = async (id: string) => {
    await deleteLeaveRequestAction(id);
    setLeaveRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const updateLeaveBalance = (leaveType: string, total: number, used: number) => {
    setLeaveBalances((prev) =>
      prev.map((b) =>
        b.leaveType === leaveType ? { ...b, total, used, remaining: Math.max(0, total - used) } : b
      )
    );
  };

  return (
    <LeaveContext.Provider value={{ leaveRequests, leaveBalances, isLoading, addLeaveRequest, updateLeaveStatus, updateLeaveRequest, deleteLeaveRequest, updateLeaveBalance }}>
      {children}
    </LeaveContext.Provider>
  );
}

export function useLeave() {
  const context = useContext(LeaveContext);
  if (context === undefined) {
    throw new Error('useLeave must be used within a LeaveProvider');
  }
  return context;
}
