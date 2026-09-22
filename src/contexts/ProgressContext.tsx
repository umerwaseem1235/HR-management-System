'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo, ReactNode } from 'react';
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
  ensureLoaded: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ProgressEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fetchedRef = useRef(false);

  const loadData = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setIsLoading(true);
    try {
      const data = await getProgressEntries();
      setEntries(data);
    } catch (error) {
      console.error('Failed to load progress entries:', error);
      fetchedRef.current = false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const ensureLoaded = useCallback(() => {
    if (!fetchedRef.current) loadData();
  }, [loadData]);

  const addEntry = useCallback(async (input: NewProgressInput): Promise<ProgressEntry> => {
    const entry = await createProgressEntry({
      employeeId: input.employeeId,
      projectName: input.projectName,
      description: input.description,
      submissionDate: input.submissionDate
    });
    setEntries((prev) => [entry, ...prev]);
    return entry;
  }, []);

  const updateEntry = useCallback(async (id: string, input: UpdateProgressInput) => {
    await updateProgressEntryAction(id, input);
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...input } : e)));
  }, []);

  const deleteEntry = useCallback(async (id: string) => {
    await deleteProgressEntryAction(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      entries,
      isLoading,
      addEntry,
      updateEntry,
      deleteEntry,
      ensureLoaded,
    }),
    [entries, isLoading, addEntry, updateEntry, deleteEntry, ensureLoaded]
  );

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  const { ensureLoaded } = context;
  useEffect(() => {
    ensureLoaded();
  }, [ensureLoaded]);
  return context;
}
