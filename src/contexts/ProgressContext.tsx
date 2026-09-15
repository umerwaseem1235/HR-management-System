'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ProgressEntry } from '../lib/types';

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
  addEntry: (input: NewProgressInput) => ProgressEntry;
  updateEntry: (id: string, input: UpdateProgressInput) => void;
  deleteEntry: (id: string) => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

const STORAGE_KEY = 'hrms_progress_entries';

const SEED: ProgressEntry[] = [
  { id: 'pg-1', projectName: 'CodeQor HRMS Portal', description: 'Sprint execution update — leave and attendance modules completed, blockers cleared and milestones tracked.', submissionDate: '2026-09-01', employeeId: '1', employeeName: 'Michael Chen', createdOn: '2026-09-01' },
  { id: 'pg-2', projectName: 'E-Commerce Storefront', description: 'Daily delivery sync — product listing and checkout modules reviewed, next-day plan aligned.', submissionDate: '2026-09-02', employeeId: '1', employeeName: 'Michael Chen', createdOn: '2026-09-02' },
  { id: 'pg-3', projectName: 'Healthcare CRM System', description: 'QA pass on patient records and appointment features with regression notes shared with stakeholders.', submissionDate: '2026-09-03', employeeId: '1', employeeName: 'Michael Chen', createdOn: '2026-09-03' },
  { id: 'pg-4', projectName: 'FinTech Analytics Dashboard', description: 'Backend API progress — payment endpoints optimized and integration tests updated.', submissionDate: '2026-09-04', employeeId: '1', employeeName: 'Michael Chen', createdOn: '2026-09-04' },
  { id: 'pg-5', projectName: 'Logistics Tracking App', description: 'Frontend milestone — live tracking widgets completed and pending design review.', submissionDate: '2026-09-05', employeeId: '1', employeeName: 'Michael Chen', createdOn: '2026-09-05' },
  { id: 'pg-6', projectName: 'EduLearn Mobile App', description: 'Weekend handover notes — course player fixes documented for Monday kickoff.', submissionDate: '2026-09-07', employeeId: '1', employeeName: 'Michael Chen', createdOn: '2026-09-07' },
  { id: 'pg-7', projectName: 'Real Estate Listing Portal', description: 'Client demo preparation — property search walkthrough and release notes finalized.', submissionDate: '2026-09-08', employeeId: '1', employeeName: 'Michael Chen', createdOn: '2026-09-08' },
  { id: 'pg-8', projectName: 'Restaurant POS System', description: 'Deployment progress — billing flow verified on staging and production checklist updated.', submissionDate: '2026-09-09', employeeId: '1', employeeName: 'Michael Chen', createdOn: '2026-09-09' },
  { id: 'pg-9', projectName: 'Travel Booking Engine', description: 'Sprint retrospective inputs — booking velocity, risks and next-sprint scope drafted.', submissionDate: '2026-09-10', employeeId: '1', employeeName: 'Michael Chen', createdOn: '2026-09-10' },
  { id: 'pg-10', projectName: 'Inventory Management System', description: 'Weekly consolidation — stock alerts, pending work and support needs summarized.', submissionDate: '2026-09-11', employeeId: '1', employeeName: 'Michael Chen', createdOn: '2026-09-11' },
];

const LEGACY_PROJECT_NAME = 'BIG Team Progress';

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ProgressEntry[]>(SEED);
  const [hydrated, setHydrated] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect -- localStorage hydration on mount is intentional (SSR-safe) */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // One-time migration: drop the old generic "BIG Team Progress" seed
          // so existing browsers pick up the new professional project names.
          const isLegacySeed = parsed.every(
            (e) => e && e.projectName === LEGACY_PROJECT_NAME,
          );
          if (isLegacySeed) {
            setEntries(SEED);
          } else {
            setEntries(parsed);
          }
        }
      }
    } catch {
      // Corrupt storage — keep seed
    } finally {
      setHydrated(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Storage unavailable — ignore
    }
  }, [entries, hydrated]);

  const addEntry = (input: NewProgressInput): ProgressEntry => {
    const entry: ProgressEntry = {
      id: `pg-${Date.now()}`,
      ...input,
      createdOn: new Date().toISOString().slice(0, 10),
    };
    setEntries((prev) => [entry, ...prev]);
    return entry;
  };

  const updateEntry = (id: string, input: UpdateProgressInput) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, ...input } : e)));
  };

  const deleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <ProgressContext.Provider value={{ entries, addEntry, updateEntry, deleteEntry }}>
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
