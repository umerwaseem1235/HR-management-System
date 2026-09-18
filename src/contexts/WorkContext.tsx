'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DailyWork, DailyWorkStatus } from '../lib/types';
import { getDailyWork, createDailyWork, updateDailyWork as updateDailyWorkAction, deleteDailyWork as deleteDailyWorkAction, updateDailyWorkStatus as updateDailyWorkStatusAction } from '@/lib/actions/daily-work';

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
  isLoading: boolean;
  addWork: (input: NewWorkInput) => Promise<DailyWork>;
  updateWork: (id: string, input: UpdateWorkInput) => Promise<void>;
  deleteWork: (id: string) => Promise<void>;
  updateWorkStatus: (id: string, status: DailyWorkStatus) => Promise<void>;
}

const WorkContext = createContext<WorkContextType | undefined>(undefined);

export function WorkProvider({ children }: { children: ReactNode }) {
  const [workItems, setWorkItems] = useState<DailyWork[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getDailyWork();
        setWorkItems(data);
      } catch (error) {
        console.error('Failed to load daily work:', error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const addWork = async (input: NewWorkInput): Promise<DailyWork> => {
    const item = await createDailyWork({
      employeeId: input.employeeId,
      title: input.title,
      description: input.description,
      date: input.date,
      fileData: input.fileData,
      fileName: input.fileName,
      link: input.link
    });
    setWorkItems((prev) => [item, ...prev]);
    return item;
  };

  const updateWork = async (id: string, input: UpdateWorkInput) => {
    await updateDailyWorkAction(id, input);
    setWorkItems((prev) => prev.map((w) => (w.id === id ? { ...w, ...input } : w)));
  };

  const deleteWork = async (id: string) => {
    await deleteDailyWorkAction(id);
    setWorkItems((prev) => prev.filter((w) => w.id !== id));
  };

  const updateWorkStatus = async (id: string, status: DailyWorkStatus) => {
    await updateDailyWorkStatusAction(id, status);
    setWorkItems((prev) => prev.map((w) => (w.id === id ? { ...w, status } : w)));
  };

  return (
    <WorkContext.Provider value={{ workItems, isLoading, addWork, updateWork, deleteWork, updateWorkStatus }}>
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
