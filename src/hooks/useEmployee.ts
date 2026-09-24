import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getEmployeeByUserId } from '@/lib/actions/employees';
import { createResourceCache } from '@/lib/resource-cache';
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

export function useEmployee(): EmployeeResolution {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
  }, [user?.id]);

  const employeeId = employee?.id ?? user?.employeeId ?? user?.id ?? '';
  const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : (user?.name ?? '');
  const isEmployee = user?.role === 'employee';

  return { user, employee, employeeId, employeeName, isEmployee, isLoading };
}
