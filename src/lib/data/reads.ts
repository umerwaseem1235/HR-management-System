/**
 * Client-side read API.
 *
 * Drop-in replacements for the read-only Server Actions in `@/lib/actions/*`:
 * same names, same signatures, same return types — but routed through the
 * batched `/api/data` endpoint (see `read-client.ts`) so concurrent reads run
 * in parallel in a single request instead of queueing one at a time.
 *
 * Usage in client code:
 *   import { getEmployees, getHolidays } from '@/lib/data/reads';
 *
 * Mutations (create/update/delete) must keep importing from `@/lib/actions/*`.
 */

import { remoteRead } from './read-client';

// attendance
export const getAttendanceByDate = remoteRead('getAttendanceByDate');
export const getAttendanceByEmployee = remoteRead('getAttendanceByEmployee');
export const getAllAttendance = remoteRead('getAllAttendance');
export const getAttendanceStats = remoteRead('getAttendanceStats');
export const getAttendanceData = remoteRead('getAttendanceData');
export const getCorrections = remoteRead('getCorrections');
export const getHolidays = remoteRead('getHolidays');
export const getMyCheckInStatus = remoteRead('getMyCheckInStatus');

// audit
export const getAuditLogs = remoteRead('getAuditLogs');
export const getAuditLogsByModule = remoteRead('getAuditLogsByModule');

// cv storage
export const getCvDownloadUrl = remoteRead('getCvDownloadUrl');

// daily work
export const getDailyWork = remoteRead('getDailyWork');

// dashboard
export const getDashboardStats = remoteRead('getDashboardStats');
export const getDashboardData = remoteRead('getDashboardData');
export const getAttendanceTrend = remoteRead('getAttendanceTrend');

// documents
export const getDocuments = remoteRead('getDocuments');
export const getDocumentDownloadUrl = remoteRead('getDocumentDownloadUrl');

// employee dashboard
export const getEmployeeDashboardBundle = remoteRead('getEmployeeDashboardBundle');

// employees
export const getEmployees = remoteRead('getEmployees');
export const getEmployee = remoteRead('getEmployee');
export const getEmployeeAvatars = remoteRead('getEmployeeAvatars');
export const getLookupData = remoteRead('getLookupData');
export const getEmployeeByUserId = remoteRead('getEmployeeByUserId');

// expenses
export const getExpenseClaims = remoteRead('getExpenseClaims');

// leave
export const getLeaveTypes = remoteRead('getLeaveTypes');
export const getLeaveRequests = remoteRead('getLeaveRequests');
export const getLeaveBalances = remoteRead('getLeaveBalances');

// notifications
export const getNotifications = remoteRead('getNotifications');
export const getHrAdminUserIds = remoteRead('getHrAdminUserIds');
export const getEmployeeUserId = remoteRead('getEmployeeUserId');

// payroll
export const getPayrollRuns = remoteRead('getPayrollRuns');
export const getPayrollRun = remoteRead('getPayrollRun');
export const getPayslips = remoteRead('getPayslips');
export const getSalaryComponents = remoteRead('getSalaryComponents');
export const getPayrollData = remoteRead('getPayrollData');

// performance
export const getPerformanceReviews = remoteRead('getPerformanceReviews');
export const getGoals = remoteRead('getGoals');

// progress
export const getProgressEntries = remoteRead('getProgressEntries');

// recruitment
export const getJobs = remoteRead('getJobs');
export const getJob = remoteRead('getJob');
export const getCandidates = remoteRead('getCandidates');
export const getCandidateHistory = remoteRead('getCandidateHistory');
export const getInterviews = remoteRead('getInterviews');
export const getOffers = remoteRead('getOffers');
export const getRecruitmentData = remoteRead('getRecruitmentData');

// remote work
export const getRemoteRequests = remoteRead('getRemoteRequests');

// reports
export const getReportEmployees = remoteRead('getReportEmployees');
export const getAttendanceReport = remoteRead('getAttendanceReport');

// settings (settings' getLeaveTypes is exported as getSettingsLeaveTypes —
// it maps rows differently from the leave module's getLeaveTypes)
export const getSettings = remoteRead('getSettings');
export const getCompanySettings = remoteRead('getCompanySettings');
export const getLateArrivalRule = remoteRead('getLateArrivalRule');
export const getDepartments = remoteRead('getDepartments');
export const getDesignations = remoteRead('getDesignations');
export const getBranches = remoteRead('getBranches');
export const getShifts = remoteRead('getShifts');
export const getSettingsLeaveTypes = remoteRead('getSettingsLeaveTypes');
export const getSettingsData = remoteRead('getSettingsData');
