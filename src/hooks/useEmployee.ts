import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getEmployeeByUserId } from '@/lib/actions/employees';
<<<<<<< HEAD
import { createResourceCache } from '@/lib/resource-cache';
=======
import { cachedQuery, peekStaleQuery } from '@/lib/query-cache';
>>>>>>> 77f10f9747aad4e0dd6e5708d9f89134faf2b97a
import type { Employee, User } from '../lib/types';

// Module scope survives navigation; keyed per auth user so returning to a
// page that resolves the employee record paints instantly.
function employeeCacheFor(userId: string) {
  return createResourceCache<Employee | null>(`employee:by-user:${userId}`, 60_000);
}

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
<<<<<<< HEAD
    let cancelled = false;
    (async () => {
      if (!user?.id) {
        if (!cancelled) {
          setEmployee(undefined);
          setIsLoading(false);
        }
        return;
      }
      const cache = employeeCacheFor(user.id);
      const snapshot = cache.peek();
      if (snapshot) {
        if (!cancelled) {
          setEmployee(snapshot.data ?? undefined);
          setIsLoading(false);
        }
        if (!snapshot.isStale) return;
      } else if (!cancelled) {
        setIsLoading(true);
      }
      try {
        const emp = await cache.load(() => getEmployeeByUserId(user.id), { force: true });
        if (!cancelled) setEmployee(emp || undefined);
      } catch (err) {
        if (!cancelled) console.error('Failed to resolve employee for user:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
=======
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
>>>>>>> 77f10f9747aad4e0dd6e5708d9f89134faf2b97a
  }, [user?.id]);

  const employeeId = employee?.id ?? user?.employeeId ?? user?.id ?? '';
  const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : (user?.name ?? '');
  const isEmployee = user?.role === 'employee';

  return { user, employee, employeeId, employeeName, isEmployee, isLoading };
}
