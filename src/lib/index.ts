/**
 * `lib` barrel — additive convenience re-exports only.
 *
 * Nothing in the codebase imports from here yet; existing deep imports
 * (`lib/payroll`, `lib/reports-pdf`, …) are untouched. New code may use:
 *
 *   import { REPORT_META, type ReportId } from '../lib';
 *
 * No circular dependencies: none of the modules below import from this barrel.
 */

export * from './types';
export * from './constants';
export * from './payroll';
export * from './payroll-pdf';
export {
  LIBRARY_REPORT_IDS,
  REPORT_META,
  downloadTabReport,
} from './reports-pdf';
export type { ReportId } from './reports-pdf';