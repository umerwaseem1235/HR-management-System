/**
 * Server-side allow-list of read-only data functions exposed through the
 * batched `/api/data` Route Handler.
 *
 * WHY THIS EXISTS
 * ---------------
 * Next.js dispatches Server Actions *one at a time per client* (see
 * `node_modules/next/dist/docs/01-app/02-guides/server-actions.md`,
 * "Sequential dispatch on the client"). Every module used to load its data
 * through several Server Actions, so a page firing 6 reads waited for 6 full
 * network round trips back-to-back — and any background read (avatars,
 * notifications, stats) queued in front of the page's own data.
 *
 * The Next.js docs recommend a Route Handler for non-mutation requests. The
 * client batcher (`read-client.ts`) coalesces every read issued in the same
 * tick into ONE HTTP request, and the route runs them in parallel here.
 *
 * Only functions listed below can be invoked. They are the exact same
 * functions the app already exposed as Server Actions, so this adds no new
 * attack surface — reads still go through the caller's cookie session and
 * Supabase RLS. Mutations intentionally stay Server Actions.
 *
 * This module must only ever be imported by server code (the route handler);
 * client code may import its *types* only.
 */

import {
  getAttendanceByDate,
  getAttendanceByEmployee,
  getAllAttendance,
  getAttendanceStats,
  getAttendanceData,
  getCorrections,
  getHolidays,
  getMyCheckInStatus,
} from '@/lib/actions/attendance';
import { getAuditLogs, getAuditLogsByModule } from '@/lib/actions/audit';
import { getCvDownloadUrl } from '@/lib/actions/cv-storage';
import { getDailyWork } from '@/lib/actions/daily-work';
import { getDashboardStats, getDashboardData, getAttendanceTrend } from '@/lib/actions/dashboard';
import { getDocuments, getDocumentDownloadUrl } from '@/lib/actions/documents';
import { getEmployeeDashboardBundle } from '@/lib/actions/employee-dashboard';
import {
  getEmployees,
  getEmployee,
  getEmployeeAvatars,
  getLookupData,
  getEmployeeByUserId,
} from '@/lib/actions/employees';
import { getExpenseClaims } from '@/lib/actions/expenses';
import { getLeaveTypes, getLeaveRequests, getLeaveBalances } from '@/lib/actions/leave';
import { getNotifications, getHrAdminUserIds, getEmployeeUserId } from '@/lib/actions/notifications';
import {
  getPayrollRuns,
  getPayrollRun,
  getPayslips,
  getSalaryComponents,
  getPayrollData,
} from '@/lib/actions/payroll';
import { getPerformanceReviews, getGoals } from '@/lib/actions/performance';
import { getProgressEntries } from '@/lib/actions/progress';
import {
  getJobs,
  getJob,
  getCandidates,
  getCandidateHistory,
  getInterviews,
  getOffers,
  getRecruitmentData,
} from '@/lib/actions/recruitment';
import { getRemoteRequests } from '@/lib/actions/remote';
import { getReportEmployees, getAttendanceReport } from '@/lib/actions/reports';
import {
  getSettings,
  getCompanySettings,
  getLateArrivalRule,
  getDepartments,
  getDesignations,
  getBranches,
  getShifts,
  getLeaveTypes as getSettingsLeaveTypes,
  getSettingsData,
} from '@/lib/actions/settings';

type AnyRead = (...args: never[]) => Promise<unknown>;

export const READ_REGISTRY = {
  // attendance
  getAttendanceByDate,
  getAttendanceByEmployee,
  getAllAttendance,
  getAttendanceStats,
  getAttendanceData,
  getCorrections,
  getHolidays,
  getMyCheckInStatus,
  // audit
  getAuditLogs,
  getAuditLogsByModule,
  // cv storage
  getCvDownloadUrl,
  // daily work
  getDailyWork,
  // dashboard
  getDashboardStats,
  getDashboardData,
  getAttendanceTrend,
  // documents
  getDocuments,
  getDocumentDownloadUrl,
  // employee dashboard
  getEmployeeDashboardBundle,
  // employees
  getEmployees,
  getEmployee,
  getEmployeeAvatars,
  getLookupData,
  getEmployeeByUserId,
  // expenses
  getExpenseClaims,
  // leave
  getLeaveTypes,
  getLeaveRequests,
  getLeaveBalances,
  // notifications
  getNotifications,
  getHrAdminUserIds,
  getEmployeeUserId,
  // payroll
  getPayrollRuns,
  getPayrollRun,
  getPayslips,
  getSalaryComponents,
  getPayrollData,
  // performance
  getPerformanceReviews,
  getGoals,
  // progress
  getProgressEntries,
  // recruitment
  getJobs,
  getJob,
  getCandidates,
  getCandidateHistory,
  getInterviews,
  getOffers,
  getRecruitmentData,
  // remote
  getRemoteRequests,
  // reports
  getReportEmployees,
  getAttendanceReport,
  // settings
  getSettings,
  getCompanySettings,
  getLateArrivalRule,
  getDepartments,
  getDesignations,
  getBranches,
  getShifts,
  getSettingsLeaveTypes,
  getSettingsData,
} satisfies Record<string, AnyRead>;

export type ReadRegistry = typeof READ_REGISTRY;
export type ReadName = keyof ReadRegistry;

export function isReadName(name: unknown): name is ReadName {
  return typeof name === 'string' && Object.prototype.hasOwnProperty.call(READ_REGISTRY, name);
}
