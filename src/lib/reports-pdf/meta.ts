/**
 * Report registry shared by every PDF report module.
 *
 * Moved verbatim from `../reports-pdf.ts` — no behavior change.
 * Import from here (or from the `reports-pdf` barrel) for new report modules.
 */

export type ReportId =
  | 'employee-master'
  | 'headcount'
  | 'attendance'
  | 'late-early'
  | 'leave-balance'
  | 'leave-utilization'
  | 'payroll-summary'
  | 'recruitment-pipeline'
  | 'performance-reviews'
  | 'expense-claims'
  | 'audit-log'
  | 'progress';

/** The four reports surfaced in the Export Library UI (and the PDF pack). */
export const LIBRARY_REPORT_IDS: ReportId[] = ['attendance', 'progress', 'payroll-summary', 'expense-claims'];

export const REPORT_META: Record<ReportId, { fileSlug: string; title: string; category: string }> = {
  'employee-master': { fileSlug: 'employee-master-report', title: 'Employee Master Report', category: 'HR' },
  'headcount': { fileSlug: 'headcount-report', title: 'Headcount Report', category: 'HR' },
  'attendance': { fileSlug: 'attendance-report', title: 'Attendance Report', category: 'Attendance' },
  'late-early': { fileSlug: 'late-early-report', title: 'Late & Early Report', category: 'Attendance' },
  'leave-balance': { fileSlug: 'leave-balance-report', title: 'Leave Balance Report', category: 'Leave' },
  'leave-utilization': { fileSlug: 'leave-utilization-report', title: 'Leave Utilization Report', category: 'Leave' },
  'payroll-summary': { fileSlug: 'payroll-summary-report', title: 'Payroll Summary', category: 'Payroll' },
  'recruitment-pipeline': { fileSlug: 'recruitment-pipeline-report', title: 'Recruitment Pipeline', category: 'Recruitment' },
  'performance-reviews': { fileSlug: 'performance-reviews-report', title: 'Performance Reviews', category: 'Performance' },
  'expense-claims': { fileSlug: 'expense-claims-report', title: 'Expense Claims Report', category: 'Finance' },
  'audit-log': { fileSlug: 'audit-activity-log', title: 'Audit Activity Log', category: 'Security' },
  'progress': { fileSlug: 'progress-report', title: 'Progress Report', category: 'Progress' },
};
