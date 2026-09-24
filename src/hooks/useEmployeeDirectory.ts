'use client';

import { useCallback, useEffect, useState } from 'react';
import { getEmployees } from '@/lib/actions/employees';
import { createResourceCache } from '@/lib/resource-cache';
import type { Employee, User } from '@/lib/types';

// Shared across every view that resolves users/dropdowns (remote, progress,
// reports, leave, profile, documents). Module scope survives navigation, so
// returning to any of those pages paints instantly instead of re-running the
// directory query.
const directoryCache = createResourceCache<Employee[]>('employees:directory', 60_000);

/**
 * Shared live employee directory. Replaces all `mockEmployees` lookups:
 * matching the logged-in user to their record and populating dropdowns.
 */
export function useEmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[]>(() => directoryCache.get() ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(() => directoryCache.get() === null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setEmployees(await directoryCache.load(getEmployees, { force: true }));
    } catch (err) {
      console.error('Failed to load employee directory:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snapshot = directoryCache.peek();
      if (snapshot) {
        if (!cancelled) {
          setEmployees(snapshot.data);
          setIsLoading(false);
        }
        if (!snapshot.isStale) return;
      }
      try {
        const data = await directoryCache.load(getEmployees, { force: true });
        if (!cancelled) setEmployees(data);
      } catch (err) {
        console.error('Failed to load employee directory:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const findByUser = useCallback(
    (user: User | null | undefined): Employee | undefined => {
      if (!user) return undefined;
      return (
        employees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
        employees.find(
          (e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase(),
        )
      );
    },
    [employees],
  );

  return { employees, isLoading, refresh, findByUser };
}
