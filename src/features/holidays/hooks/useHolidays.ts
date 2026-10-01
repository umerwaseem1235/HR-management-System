'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { createHoliday, deleteHoliday, getHolidays } from '@/lib/actions/attendance';
import { cachedQuery, peekQuery, primeQuery } from '@/lib/query-cache';
import { invalidateQuery, ATTENDANCE_HOLIDAYS_KEY } from '@/lib/attendance-cache';
import type { Holiday } from '../types';

export const HOLIDAYS_CACHE_KEY = 'holidays';

export interface NewHolidayInput {
  name: string;
  date: string;
  type: string;
  isRecurring: boolean;
}

export function useHolidays() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  // Stale-while-revalidate: a cached list paints instantly and revalidates
  // silently — only a cold start (no cache) shows the loading state.
  const [holidays, setHolidays] = useState<Holiday[]>(() => peekQuery<Holiday[]>(HOLIDAYS_CACHE_KEY) ?? []);
  const [holidayMsg, setHolidayMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(() => peekQuery<Holiday[]>(HOLIDAYS_CACHE_KEY) === undefined);
  const [confirmDeleteHoliday, setConfirmDeleteHoliday] = useState<Holiday | null>(null);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'hr_manager';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await cachedQuery<Holiday[]>(HOLIDAYS_CACHE_KEY, getHolidays);
        if (!cancelled) setHolidays(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load holidays');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addHoliday = useCallback(
    async (input: NewHolidayInput) => {
      const name = input.name.trim();
      const date = input.date;
      if (!name || !date) return;
      try {
        const newHoliday = await createHoliday({
          name,
          date,
          type: input.type || 'Public',
          isRecurring: input.isRecurring,
        });
        setHolidays((current) => {
          const next = [...current, newHoliday].sort((a, b) => a.date.localeCompare(b.date));
          primeQuery(HOLIDAYS_CACHE_KEY, next);
          return next;
        });
        invalidateQuery(ATTENDANCE_HOLIDAYS_KEY);
        addNotification({
          title: 'New Holiday Announced',
          message: `${name} on ${date} (${input.type || 'Public'}) — notified to all employees.`,
          type: 'info',
          link: '/holidays',
        });
        setHolidayMsg(`${name} on ${date} added — notification sent to all employees.`);
      } catch (err: unknown) {
        setError(err instanceof Error && err.message ? err.message : 'Failed to add holiday');
      }
    },
    [addNotification],
  );

  // Thin DOM adapter — parses the HolidayManager form and delegates to addHoliday.
  // Kept so the presentational component stays unchanged.
  const handleAddHoliday = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const fd = new FormData(form);
      const name = String(fd.get('holidayName') || '').trim();
      const date = String(fd.get('holidayDate') || '');
      const type = String(fd.get('holidayType') || 'Public');
      const isRecurring = fd.get('holidayRecurring') === 'on';
      if (!name || !date) return;
      await addHoliday({ name, date, type, isRecurring });
      form.reset();
    },
    [addHoliday],
  );

  const handleDeleteHoliday = useCallback(async (id: string) => {
    try {
      await deleteHoliday(id);
      setHolidays((current) => {
        const next = current.filter((x) => x.id !== id);
        primeQuery(HOLIDAYS_CACHE_KEY, next);
        return next;
      });
      invalidateQuery(ATTENDANCE_HOLIDAYS_KEY);
    } catch (err: unknown) {
      setError(err instanceof Error && err.message ? err.message : 'Failed to delete holiday');
    }
  }, []);

  return {
    user,
    isAdmin,
    holidays,
    holidayMsg,
    error,
    loading,
    confirmDeleteHoliday,
    setConfirmDeleteHoliday,
    addHoliday,
    handleAddHoliday,
    handleDeleteHoliday,
  };
}

export type UseHolidaysReturn = ReturnType<typeof useHolidays>;
