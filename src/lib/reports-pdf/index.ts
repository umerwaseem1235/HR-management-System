/**
 * `lib/reports-pdf` barrel — the package's public surface.
 *
 * Re-exports the exact public API of the former single-file
 * `lib/reports-pdf.ts` with identical names, so existing imports keep
 * working unchanged:
 *
 *   import { downloadReport, downloadAllReportsPack, type ReportId }
 *     from '../../lib/reports-pdf';
 *
 * Per-report renderers and shared helpers stay importable via deep paths
 * (e.g. `../../lib/reports-pdf/attendance-report`) but are intentionally
 * not re-exported here, keeping this surface identical to the original.
 */

export type { ReportId } from './meta';
export { LIBRARY_REPORT_IDS, REPORT_META } from './meta';
export { downloadReport, generateReportBlob, reportFileName } from './core';
export { downloadAllReportsPack } from './pack';
