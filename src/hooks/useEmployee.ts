import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mockEmployees } from '../lib/mock-data';
import type { Employee, User } from '../lib/types';

/**
 * Resolves the logged-in user to their employee record.
 *
 * Deduplicates the matching logic copy-pasted across the expenses, leave,
 * attendance, progress, remote, documents and reports pages: match by email
 * first, then by full name (case-insensitive). Falls back to the raw user
 * name/id when no employee record matches (e.g. admin accounts).
 *
 * Adoption is opt-in — no existing page was migrated to it yet; new pages
 * and future refactors should prefer this hook over inline `useMemo` blocks.
 */

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
}

/** Pure matcher (exported for tests); the hook memoizes it over `user`. */
export function resolveEmployeeForUser(user: User | null): Employee | undefined {
  if (!user) return undefined;
  return (
    mockEmployees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
    mockEmployees.find((e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase())
  );
}

/**
 * @example
 * const { employee, employeeId, employeeName, isEmployee } = useEmployee();
 * const visible = useMemo(
 *   () => (isEmployee ? rows.filter((r) => r.employeeId === employeeId) : rows),
 *   [isEmployee, rows, employeeId],
 * );
 */
export function useEmployee(): EmployeeResolution {
  const { user } = useAuth();

  const employee = useMemo(() => resolveEmployeeForUser(user), [user]);

  const employeeId = employee?.id ?? user?.id ?? '';
  const employeeName = employee ? `${employee.firstName} ${employee.lastName}` : (user?.name ?? '');
  const isEmployee = user?.role === 'employee';

  return { user, employee, employeeId, employeeName, isEmployee };
}
