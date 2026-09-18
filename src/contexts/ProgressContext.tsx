'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ProgressEntry } from '../lib/types';
import { getProgressEntries, createProgressEntry, updateProgressEntry as updateProgressEntryAction, deleteProgressEntry as deleteProgressEntryAction } from '@/lib/actions/progress';

export interface NewProgressInput {
  projectName: string;
  description: string;
  submissionDate: string;
  employeeId: string;
  employeeName: string;
}

export interface UpdateProgressInput {
  projectName: string;
  description: string;
  submissionDate: string;
}

interface ProgressContextType {
  entries: ProgressEntry[];
  isLoading: boolean;
  addEntry: (input: NewProgressInput) => Promise<ProgressEntry>;
  updateEntry: (id: string, input: UpdateProgressInput) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getProgressEntries();
        setEntries(data);
      } catch (error) {
        console.error('Failed to load progress entries:', error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const addEntry = async (input: NewProgressInput): Promise<ProgressEntry> => {
    const entry = await createProgressEntry({
      employeeId: input.employeeId,
      projectName: input.projectName,
      description: input.description,
      submissionDate: input.submissionDate
    });
    setEntries((prev) => [entry, ...prev]);
    return entry;
  };

  const updateEntry = async (id: string, input: UpdateProgressInput) => {
    await updateProgressEntryAction(id, input);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...input } : e)));
  };

  const deleteEntry = async (id: string) => {
    await deleteProgressEntryAction(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <ProgressContext.Provider value={{ entries, isLoading, addEntry, updateEntry, deleteEntry }}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
