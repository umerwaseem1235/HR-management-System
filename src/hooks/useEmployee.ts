import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getEmployeeByUserId } from '@/lib/actions/employees';
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

export function useEmployee(): EmployeeResolution {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    if (user?.id) {
      getEmployeeByUserId(user.id)
        .then((emp) => setEmployee(emp || undefined))
        .catch((err) => {
          console.error('Failed to resolve employee for user:', err);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  const employeeId = employee?.id ?? user?.employeeId ?? user?.id ?? '';
  const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : (user?.name ?? '');
  const isEmployee = user?.role === 'employee';

  return { user, employee, employeeId, employeeName, isEmployee, isLoading };
}
