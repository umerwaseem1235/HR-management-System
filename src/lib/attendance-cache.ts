import { invalidateQuery } from './query-cache';

/**
 * Shared cache keys linking the employee attendance module and the employee
 * dashboard. Both display today's check-in/out state, so a mutation in one
 * module must invalidate the other — each visit then falls back to a normal
 * fresh load (same cost as before caching), while pure navigation stays
 * instant from cache.
 */

export const ATTENDANCE_STATS_KEY = 'attendance:stats';

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
}

/** After a check-in/out on the dashboard: the attendance module must refetch. */
export function invalidateDashboardCache(employeeId: string): void {
  invalidateQuery(employeeDashboardKey(employeeId));
}

/** Full sweep after any attendance record mutation — both the attendance
 *  module and the dashboard re-fetch on the next visit. */
export function invalidateAttendanceViews(employeeId?: string): void {
  invalidateAttendanceCache(employeeId);
  if (employeeId) invalidateDashboardCache(employeeId);
}
