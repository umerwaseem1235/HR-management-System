import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getEmployeeByUserId } from '@/lib/actions/employees';
import { cachedQuery, peekStaleQuery } from '@/lib/query-cache';
import type { Employee, User } from '../lib/types';

export interface EmployeeResolution {
  /** Raw auth user (`null` when logged out). */
  user: User | null;
  /** Matched employee record, if any. */
  employee: Employee | undefined;
  /** `employee.id`, else `user.id`, else `''`. */
  employeeId: string;
  /** `First Last` of the match, else `user.name`, else `''`. */
  employeeName: string;
  /** `true` for the `employee` role. */
  isEmployee: boolean;
  /** Whether the employee data is still loading. */
  isLoading: boolean;
}

const employeeCacheKey = (userId: string) => `employee-by-user:${userId}`;

export function useEmployee(): EmployeeResolution {
  const { user } = useAuth();
  // Paint last-known record instantly on remount (module switch back).
  const [employee, setEmployee] = useState<Employee | undefined>(() => {
    const cached = user?.id
      ? peekStaleQuery<Employee | null>(employeeCacheKey(user.id))
      : undefined;
    return cached ?? undefined;
  });
  const [isLoading, setIsLoading] = useState(() => {
    const cached = user?.id
      ? peekStaleQuery<Employee | null>(employeeCacheKey(user.id))
      : undefined;
    return cached === undefined;
  });

  useEffect(() => {
    if (!user?.id) {
      setEmployee(undefined);
      setIsLoading(false);
      return;
    }
    const key = employeeCacheKey(user.id);
    const cached = peekStaleQuery<Employee | null>(key);
    if (cached !== undefined) {
      setEmployee(cached ?? undefined);
      setIsLoading(false);
    } else {
      setEmployee(undefined);
      setIsLoading(true);
    }

    let cancelled = false;
    cachedQuery(key, () => getEmployeeByUserId(user.id))
      .then((emp) => {
        if (!cancelled) setEmployee(emp ?? undefined);
      })
      .catch((err) => {
        console.error('Failed to resolve employee for user:', err);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const employeeId = employee?.id ?? user?.employeeId ?? user?.id ?? '';
  const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : (user?.name ?? '');
  const isEmployee = user?.role === 'employee';

  return { user, employee, employeeId, employeeName, isEmployee, isLoading };
}
