/**
 * Single-report dispatch + public API.
 *
 * `addReportContent` is the original 12-way switch from `../reports-pdf.ts`,
 * now delegating to the per-domain render modules. `generateReportBlob`,
 * `reportFileName` and `downloadReport` are moved verbatim.
 * No behavior change.
 */

import { jsPDF } from 'jspdf';
import { downloadBlob } from '../payroll-pdf';
import { REPORT_META, type ReportId } from './meta';
import { GRAY, MARGIN, ensureSpace, footer, header, todayLabel } from './utils';
import { renderAttendanceReport, renderLateEarlyReport } from './attendance-report';
import { renderAuditReport } from './audit-report';
import { renderEmployeeMasterReport, renderHeadcountReport } from './directory-reports';
import { renderExpenseReport } from './expense-report';
import { renderLeaveBalanceReport, renderLeaveUtilizationReport } from './leave-reports';
import { renderPayrollSummaryReport } from './payroll-report';
import { renderPerformanceReport } from './performance-report';
import { renderProgressReport } from './progress-report';
import { renderRecruitmentReport } from './recruitment-report';

/** Shared by `core` (single reports) and `pack` (multi-report pack). */
export function addReportContent(doc: jsPDF, id: ReportId, firstPage: boolean): void {
  let y = firstPage ? 40 : 20;
  const meta = REPORT_META[id];

  if (!firstPage) {
    header(doc, meta.category, meta.title);
    y = 40;
  }

  switch (id) {
    case 'employee-master': {
      y = renderEmployeeMasterReport(doc, y);
      break;
    }
    case 'headcount': {
      y = renderHeadcountReport(doc, y);
      break;
    }
    case 'attendance': {
      y = renderAttendanceReport(doc, y);
      break;
    }
    case 'late-early': {
      y = renderLateEarlyReport(doc, y);
      break;
    }
    case 'leave-balance': {
      y = renderLeaveBalanceReport(doc, y);
      break;
    }
    case 'leave-utilization': {
      y = renderLeaveUtilizationReport(doc, y);
      break;
    }
    case 'payroll-summary': {
      y = renderPayrollSummaryReport(doc, y);
      break;
    }
    case 'recruitment-pipeline': {
      y = renderRecruitmentReport(doc, y);
      break;
    }
    case 'performance-reviews': {
      y = renderPerformanceReport(doc, y);
      break;
    }
    case 'expense-claims': {
      y = renderExpenseReport(doc, y);
      break;
    }
    case 'audit-log': {
      y = renderAuditReport(doc, y);
      break;
    }
    case 'progress': {
      y = renderProgressReport(doc, y);
      break;
    }
  }

  y = ensureSpace(doc, y, 12);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text('This is a system-generated report from CodQor HRMS and does not require a signature.', MARGIN, y);
}

/* ================= Public API ================= */

export function generateReportBlob(id: ReportId): Blob {
  const meta = REPORT_META[id];
  const doc = new jsPDF();
  header(doc, `${meta.category} · ${todayLabel()}`, meta.title);
  addReportContent(doc, id, true);
  footer(doc);
  return doc.output('blob');
}

export function reportFileName(id: ReportId): string {
  return `${REPORT_META[id].fileSlug}-${todayLabel()}.pdf`;
}

export function downloadReport(id: ReportId): void {
  downloadBlob(reportFileName(id), generateReportBlob(id));
}
