'use client';

import { useCallback, useEffect, useState } from 'react';
import { getEmployees } from '@/lib/actions/employees';
import type { Employee, User } from '@/lib/types';

/**
 * Shared live employee directory. Replaces all `mockEmployees` lookups:
 * matching the logged-in user to their record and populating dropdowns.
 */
export function useEmployeeDirectory() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setEmployees(await getEmployees());
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
