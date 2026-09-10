'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { LeaveRequest } from '../lib/types';
import { mockLeaveRequests } from '../lib/mock-data';

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
  addLeaveRequest: (input: NewLeaveInput) => LeaveRequest;
  updateLeaveStatus: (id: string, status: 'Approved' | 'Rejected', approvedBy?: string, comments?: string) => void;
  updateLeaveRequest: (id: string, input: { leaveType: string; startDate: string; endDate: string; days: number; reason: string }) => void;
  deleteLeaveRequest: (id: string) => void;
}

const LeaveContext = createContext<LeaveContextType | undefined>(undefined);

const STORAGE_KEY = 'hrms_leave_requests';

export function LeaveProvider({ children }: { children: ReactNode }) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(mockLeaveRequests);

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

  // Persist so submitted requests survive reloads
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leaveRequests));
    } catch {
      // Storage unavailable — ignore
    }
  }, [leaveRequests]);

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

  return (
    <LeaveContext.Provider value={{ leaveRequests, addLeaveRequest, updateLeaveStatus, updateLeaveRequest, deleteLeaveRequest }}>
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
