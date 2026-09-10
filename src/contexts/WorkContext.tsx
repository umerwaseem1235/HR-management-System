'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DailyWork, DailyWorkStatus } from '../lib/types';

export interface NewWorkInput {
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  date: string;
  fileData?: string;
  fileName?: string;
  link?: string;
}

export interface UpdateWorkInput {
  title: string;
  description: string;
  date: string;
  fileData?: string;
  fileName?: string;
  link?: string;
}

interface WorkContextType {
  workItems: DailyWork[];
  addWork: (input: NewWorkInput) => DailyWork;
  updateWork: (id: string, input: UpdateWorkInput) => void;
  deleteWork: (id: string) => void;
  updateWorkStatus: (id: string, status: DailyWorkStatus) => void;
}

const WorkContext = createContext<WorkContextType | undefined>(undefined);

const STORAGE_KEY = 'hrms_daily_work';

export function WorkProvider({ children }: { children: ReactNode }) {
  const [workItems, setWorkItems] = useState<DailyWork[]>([]);

  // Load persisted work after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setWorkItems(JSON.parse(stored));
      }
    } catch {
      // Corrupt storage — start empty
    }
  }, []);

  // Persist so submitted work survives reloads
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workItems));
    } catch {
      // Storage unavailable — ignore
    }
  }, [workItems]);

  const addWork = (input: NewWorkInput): DailyWork => {
    const item: DailyWork = {
      id: `work-${Date.now()}`,
      ...input,
      status: 'Submitted',
      submittedOn: new Date().toISOString().slice(0, 10),
    };
    setWorkItems((prev) => [item, ...prev]);
    return item;
  };

  const updateWork = (id: string, input: UpdateWorkInput) => {
    setWorkItems((prev) => prev.map((w) => (w.id === id ? { ...w, ...input } : w)));
  };

  const deleteWork = (id: string) => {
    setWorkItems((prev) => prev.filter((w) => w.id !== id));
  };

  const updateWorkStatus = (id: string, status: DailyWorkStatus) => {
    setWorkItems((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)));
  };

  return (
    <WorkContext.Provider value={{ workItems, addWork, updateWork, deleteWork, updateWorkStatus }}>
      {children}
    </WorkContext.Provider>
  );
}

export function useWork() {
  const context = useContext(WorkContext);
  if (context === undefined) {
    throw new Error('useWork must be used within a WorkProvider');
  }
  return context;
}
