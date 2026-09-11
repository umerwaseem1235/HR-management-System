'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LeaveRequest, LeaveBalance } from '../lib/types';
import { mockLeaveRequests, mockLeaveBalances } from '../lib/mock-data';

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
        setLeaveRequests(JSON.parse(stored));
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
        setLeaveBalances(JSON.parse(stored));
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
