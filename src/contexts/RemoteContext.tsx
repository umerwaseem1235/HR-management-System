'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo, ReactNode } from 'react';
import { RemoteRequest, RemoteRequestStatus } from '../lib/types';
import { getRemoteRequests, createRemoteRequest, updateRemoteStatus as updateRemoteStatusAction, deleteRemoteRequest as deleteRemoteRequestAction } from '@/lib/actions/remote';

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
  isLoading: boolean;
  addRemoteRequest: (input: NewRemoteInput) => Promise<RemoteRequest>;
  updateRemoteStatus: (id: string, status: RemoteRequestStatus, reviewedBy?: string, reviewComments?: string) => Promise<void>;
  deleteRemoteRequest: (id: string) => Promise<void>;
  ensureLoaded: () => void;
}

const RemoteContext = createContext<RemoteContextType | undefined>(undefined);

export function RemoteProvider({ children }: { children: ReactNode }) {
  const [remoteRequests, setRemoteRequests] = useState<RemoteRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchedRef = useRef(false);

  const loadData = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setIsLoading(true);
    try {
      const data = await getRemoteRequests();
      setRemoteRequests(data);
    } catch (error) {
      console.error('Failed to load remote requests:', error);
      fetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const ensureLoaded = useCallback(() => {
    if (!fetchedRef.current) loadData();
  }, [loadData]);

  const addRemoteRequest = useCallback(async (input: NewRemoteInput): Promise<RemoteRequest> => {
    const request = await createRemoteRequest({
      employeeId: input.employeeId,
      fromDate: input.fromDate,
      toDate: input.toDate,
      days: input.days,
      reason: input.reason,
      workPlan: input.workPlan
    });
    setRemoteRequests((prev) => [request, ...prev]);
    return request;
  }, []);

  const updateRemoteStatus = useCallback(async (id: string, status: RemoteRequestStatus, reviewedBy?: string, reviewComments?: string) => {
    await updateRemoteStatusAction(id, status, reviewedBy, reviewComments);
    setRemoteRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status, reviewedBy, reviewComments } : r))
    );
  }, []);

  const deleteRemoteRequest = useCallback(async (id: string) => {
    await deleteRemoteRequestAction(id);
    setRemoteRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      remoteRequests,
      isLoading,
      addRemoteRequest,
      updateRemoteStatus,
      deleteRemoteRequest,
      ensureLoaded,
    }),
    [remoteRequests, isLoading, addRemoteRequest, updateRemoteStatus, deleteRemoteRequest, ensureLoaded]
  );

  return (
    <RemoteContext.Provider value={value}>
      {children}
    </RemoteContext.Provider>
  );
}

export function useRemote() {
  const context = useContext(RemoteContext);
  if (context === undefined) {
    throw new Error('useRemote must be used within a RemoteProvider');
  }
  const { ensureLoaded } = context;
  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);
  return context;
}
