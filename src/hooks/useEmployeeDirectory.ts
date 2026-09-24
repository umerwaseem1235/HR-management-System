'use client';

import { useCallback, useEffect, useState } from 'react';
import { getEmployees } from '@/lib/actions/employees';
import { cachedQuery, peekStaleQuery } from '@/lib/query-cache';
import type { Employee, User } from '@/lib/types';

// Shared directory key — same entry used by useEmployeesSupabase and useAttendance,
// so every consumer (dashboard, profile, leave, reports, ...) reuses one fetch.
const EMPLOYEES_CACHE_KEY = 'employees';

/**
 * Shared live employee directory. Replaces all `mockEmployees` lookups:
 * matching the logged-in user to their record and populating dropdowns.
 *
 * Backed by the module-level query cache: repeat mounts paint instantly from
 * the last-known list (stale-while-revalidate) instead of re-fetching.
 */
export function useEmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[]>(
    () => peekStaleQuery<Employee[]>(EMPLOYEES_CACHE_KEY) ?? [],
  );
  const [isLoading, setIsLoading] = useState(
    () => peekStaleQuery<Employee[]>(EMPLOYEES_CACHE_KEY) === undefined,
  );

  const refresh = useCallback(async () => {
    // Only show a loading state when there is nothing to paint yet.
    if (peekStaleQuery<Employee[]>(EMPLOYEES_CACHE_KEY) === undefined) {
      setIsLoading(true);
    }
    try {
      setEmployees(await cachedQuery(EMPLOYEES_CACHE_KEY, getEmployees));
    } catch (err) {
      console.error('Failed to load employee directory:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

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
