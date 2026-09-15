'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LeaveRequest, LeaveBalance } from '../lib/types';
import { mockLeaveRequests, mockLeaveBalances } from '../lib/mock-data';
import { LEAVE_TYPES } from '../lib/constants';

/** Map retired leave types onto the current policy so old stored data never shows orphan cards. */
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
  // Ensure every current leave type has a card, even if storage predates it.
  for (const t of LEAVE_TYPES) {
    if (!merged.has(t.name)) {
      const fallback = mockLeaveBalances.find((b) => b.leaveType === t.name);
      merged.set(t.name, fallback ?? { leaveType: t.name, total: t.daysAllowed, used: 0, remaining: t.daysAllowed, pending: 0 });
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
  addLeaveRequest: (input: NewLeaveInput) => LeaveRequest;
  updateLeaveStatus: (id: string, status: 'Approved' | 'Rejected', approvedBy?: string, comments?: string) => void;
  updateLeaveRequest: (id: string, input: { leaveType: string; startDate: string; endDate: string; days: number; reason: string }) => void;
  deleteLeaveRequest: (id: string) => void;
  updateLeaveBalance: (leaveType: string, total: number, used: number) => void;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

const STORAGE_KEY = 'hrms_leave_requests';
const BALANCES_KEY = 'hrms_leave_balances';

export function LeaveProvider({ children }: { children: ReactNode }) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>(mockLeaveBalances);

  // Load persisted requests (including employee-submitted ones) after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLeaveRequests(sanitizeRequests(JSON.parse(stored)));
      }
    } catch {
      // Corrupt storage — keep mock defaults
    }
  }, []);

  // Load persisted balances after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BALANCES_KEY);
      if (stored) {
        setLeaveBalances(sanitizeBalances(JSON.parse(stored)));
      } else {
        setLeaveBalances(sanitizeBalances(mockLeaveBalances));
      }
    } catch {
      // Corrupt storage — keep mock defaults
    }
  }, []);

  // Persist so submitted requests survive reloads
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leaveRequests));
    } catch {
      // Storage unavailable — ignore
    }
  }, [leaveRequests]);

  // Persist balances so admin edits survive reloads
  useEffect(() => {
    try {
      localStorage.setItem(BALANCES_KEY, JSON.stringify(leaveBalances));
    } catch {
      // Storage unavailable — ignore
    }
  }, [leaveBalances]);

  const addLeaveRequest = (input: NewLeaveInput): LeaveRequest => {
    const request: LeaveRequest = {
      id: `lr-${Date.now()}`,
      ...input,
      status: 'Pending',
      appliedOn: new Date().toISOString().slice(0, 10),
    };
    setLeaveRequests((prev) => [request, ...prev]);
    return request;
  };

  const updateLeaveStatus = (id: string, status: 'Approved' | 'Rejected', approvedBy?: string, comments?: string) => {
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, approvedBy, comments } : r))
    );
  };

  const updateLeaveRequest = (id: string, input: { leaveType: string; startDate: string; endDate: string; days: number; reason: string }) => {
    setLeaveRequests((prev) => prev.map((r) => (r.id === id ? { ...r, ...input } : r)));
  };

  const deleteLeaveRequest = (id: string) => {
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
    <LeaveContext.Provider value={{ leaveRequests, leaveBalances, addLeaveRequest, updateLeaveStatus, updateLeaveRequest, deleteLeaveRequest, updateLeaveBalance }}>
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
