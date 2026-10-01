import { invalidateQuery } from './query-cache';
export { invalidateQuery } from './query-cache';

/**
 * Shared cache keys linking the employee attendance module and the employee
 * dashboard. Both display today's check-in/out state, so a mutation in one
 * module must invalidate the other — each visit then falls back to a normal
 * fresh load (same cost as before caching), while pure navigation stays
 * instant from cache.
 */

export const ATTENDANCE_STATS_KEY = 'attendance:stats';
export const ATTENDANCE_ALL_KEY = 'attendance:all';
export const ATTENDANCE_CORRECTIONS_KEY = 'attendance:corrections';
export const ATTENDANCE_HOLIDAYS_KEY = 'attendance:holidays';
export const AUDIT_LOGS_ATTENDANCE_KEY = 'audit:attendance';

export function currentMonthPrefix(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function employeeAttendanceKey(userEmployeeId: string, monthPrefix: string): string {
  return `attendance:employee:${userEmployeeId || 'all'}:${monthPrefix}`;
}

/** Same key format EmployeeDashboard uses for its cached data bundle. */
export function employeeDashboardKey(
  employeeId: string,
  dateStr: string = new Date().toISOString().slice(0, 10),
): string {
  return `employee-dashboard:${employeeId}:${dateStr}`;
}

/** After an attendance record mutation: drop the attendance module cache
 *  (scoped key, legacy all-records key, and shared stats). */
export function invalidateAttendanceCache(employeeId?: string): void {
  const prefix = currentMonthPrefix();
  if (employeeId) invalidateQuery(employeeAttendanceKey(employeeId, prefix));
  invalidateQuery(employeeAttendanceKey('all', prefix));
  invalidateQuery(ATTENDANCE_STATS_KEY);
  invalidateQuery(ATTENDANCE_ALL_KEY);
}

/** After a check-in/out on the dashboard: the attendance module must refetch. */
export function invalidateDashboardCache(employeeId: string): void {
  invalidateQuery(employeeDashboardKey(employeeId));
}

/** Full sweep after any attendance record mutation — both the attendance
 *  module and the dashboard re-fetch on the next visit. */
export function invalidateAttendanceViews(employeeId?: string): void {
  invalidateAttendanceCache(employeeId);
  invalidateAdminAttendanceCache();
  if (employeeId) invalidateDashboardCache(employeeId);
}

/** Invalidate admin-specific attendance caches (corrections, holidays, audit). */
export function invalidateAdminAttendanceCache(): void {
  invalidateQuery(ATTENDANCE_CORRECTIONS_KEY);
  invalidateQuery(ATTENDANCE_HOLIDAYS_KEY);
  invalidateQuery(AUDIT_LOGS_ATTENDANCE_KEY);
}

/** Invalidate ALL attendance-related caches. */
export function invalidateAllAttendanceCaches(): void {
  invalidateAttendanceCache();
  invalidateAdminAttendanceCache();
  invalidateQuery(ATTENDANCE_STATS_KEY);
  invalidateQuery(AUDIT_LOGS_ATTENDANCE_KEY);
}
