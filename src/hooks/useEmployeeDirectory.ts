'use client';

import { useCallback, useEffect, useState } from 'react';
import { getEmployees } from '@/lib/actions/employees';
<<<<<<< HEAD
import { createResourceCache } from '@/lib/resource-cache';
import type { Employee, User } from '@/lib/types';

// Shared across every view that resolves users/dropdowns (remote, progress,
// reports, leave, profile, documents). Module scope survives navigation, so
// returning to any of those pages paints instantly instead of re-running the
// directory query.
const directoryCache = createResourceCache<Employee[]>('employees:directory', 60_000);
=======
import { cachedQuery, peekStaleQuery } from '@/lib/query-cache';
import type { Employee, User } from '@/lib/types';

// Shared directory key — same entry used by useEmployeesSupabase and useAttendance,
// so every consumer (dashboard, profile, leave, reports, ...) reuses one fetch.
const EMPLOYEES_CACHE_KEY = 'employees';
>>>>>>> 77f10f9747aad4e0dd6e5708d9f89134faf2b97a

/**
 * Shared live employee directory. Replaces all `mockEmployees` lookups:
 * matching the logged-in user to their record and populating dropdowns.
 *
 * Backed by the module-level query cache: repeat mounts paint instantly from
 * the last-known list (stale-while-revalidate) instead of re-fetching.
 */
export function useEmployeeDirectory() {
<<<<<<< HEAD
  const [employees, setEmployees] = useState<Employee[]>(() => directoryCache.get() ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(() => directoryCache.get() === null);
=======
  const [employees, setEmployees] = useState<Employee[]>(
    () => peekStaleQuery<Employee[]>(EMPLOYEES_CACHE_KEY) ?? [],
  );
  const [isLoading, setIsLoading] = useState(
    () => peekStaleQuery<Employee[]>(EMPLOYEES_CACHE_KEY) === undefined,
  );
>>>>>>> 77f10f9747aad4e0dd6e5708d9f89134faf2b97a

  const refresh = useCallback(async () => {
    // Only show a loading state when there is nothing to paint yet.
    if (peekStaleQuery<Employee[]>(EMPLOYEES_CACHE_KEY) === undefined) {
      setIsLoading(true);
    }
    try {
<<<<<<< HEAD
      setEmployees(await directoryCache.load(getEmployees, { force: true }));
=======
      setEmployees(await cachedQuery(EMPLOYEES_CACHE_KEY, getEmployees));
>>>>>>> 77f10f9747aad4e0dd6e5708d9f89134faf2b97a
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
