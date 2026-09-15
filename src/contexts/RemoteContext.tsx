'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { RemoteRequest, RemoteRequestStatus } from '../lib/types';

export interface NewRemoteInput {
  employeeId: string;
  employeeName: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  workPlan?: string;
}

interface RemoteContextType {
  remoteRequests: RemoteRequest[];
  addRemoteRequest: (input: NewRemoteInput) => RemoteRequest;
  updateRemoteStatus: (id: string, status: RemoteRequestStatus, reviewedBy?: string, reviewComments?: string) => void;
  deleteRemoteRequest: (id: string) => void;
}

const RemoteContext = createContext<RemoteContextType | undefined>(undefined);

const STORAGE_KEY = 'hrms_remote_requests';

export function RemoteProvider({ children }: { children: ReactNode }) {
  const [remoteRequests, setRemoteRequests] = useState<RemoteRequest[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRemoteRequests(JSON.parse(stored));
    } catch {
      // Corrupt storage — start empty
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteRequests));
    } catch {
      // Storage unavailable — ignore
    }
  }, [remoteRequests]);

  const addRemoteRequest = (input: NewRemoteInput): RemoteRequest => {
    const request: RemoteRequest = {
      id: `rr-${Date.now()}`,
      ...input,
      status: 'Pending',
      requestedOn: new Date().toISOString().slice(0, 10),
    };
    setRemoteRequests((prev) => [request, ...prev]);
    return request;
  };

  const updateRemoteStatus = (id: string, status: RemoteRequestStatus, reviewedBy?: string, reviewComments?: string) => {
    setRemoteRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, reviewedBy, reviewComments } : r))
    );
  };

  const deleteRemoteRequest = (id: string) => {
    setRemoteRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <RemoteContext.Provider value={{ remoteRequests, addRemoteRequest, updateRemoteStatus, deleteRemoteRequest }}>
      {children}
    </RemoteContext.Provider>
  );
}

export function useRemote() {
  const context = useContext(RemoteContext);
  if (context === undefined) {
    throw new Error('useRemote must be used within a RemoteProvider');
  }
  return context;
}
