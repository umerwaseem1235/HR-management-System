/**
 * `hooks` barrel — shared client hooks.
 *
 * New code should import from here (or `@/hooks`):
 *
 *   import { useEmployee, usePagination } from '../hooks';
 *
 * Existing pages were intentionally NOT migrated — adoption is opt-in
 * to keep this change behavior-neutral.
 */

export { usePagination } from './usePagination';
export type { PaginatedResult, PaginationControls } from './usePagination';

export { useDebouncedSearch, useSearch } from './useSearch';
export type { DebouncedSearch, SearchState } from './useSearch';

export { useDisclosure } from './useDisclosure';
export type { Disclosure } from './useDisclosure';

export { resolveEmployeeForUser, useEmployee } from './useEmployee';
export type { EmployeeResolution } from './useEmployee';

export { useEmployeeAttendance } from './useEmployeeAttendance';
export type { EmployeeAttendanceData } from './useEmployeeAttendance';

export { useAdminAttendance } from './useAdminAttendance';
export type { AdminAttendanceData } from './useAdminAttendance';
