/**
 * Multi-report PDF pack (Export Library "Download all").
 *
 * Moved verbatim from `../reports-pdf.ts` (`downloadAllReportsPack`).
 * No behavior change.
 */

import { jsPDF } from 'jspdf';
import { downloadBlob } from '../payroll-pdf';
import { addReportContent } from './core';
import { LIBRARY_REPORT_IDS, REPORT_META } from './meta';
import {
  DARK,
  GRAY,
  MARGIN,
  NAVY,
  PAGE_W,
  TEAL,
  ensureSpace,
  footer,
  header,
  titleBlock,
  todayLabel,
} from './utils';

/** One combined, professionally paginated pack with the library reports. */
export function downloadAllReportsPack(): void {
  const doc = new jsPDF();
  const ids = LIBRARY_REPORT_IDS;

  header(doc, `Complete pack · ${todayLabel()}`, 'HR Reports Pack');
  let y = 40;
  y = titleBlock(doc, y, 'HR Reports Pack', 'Attendance · Progress · Payroll · Expenses — one professionally formatted PDF', `Generated ${todayLabel()} · ${ids.length} reports · CodQor HRMS`);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  ids.forEach((id, i) => {
    y = ensureSpace(doc, y, 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text(`${i + 1}.  ${REPORT_META[id].title}`, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(REPORT_META[id].category, PAGE_W - MARGIN, y, { align: 'right' });
    y += 7;
  });

  ids.forEach((id) => {
    doc.addPage();
    const meta = REPORT_META[id];
    header(doc, `${meta.category} · ${todayLabel()}`, meta.title);
    addReportContent(doc, id, true);
  });

  // Brand teal accent on the cover header
  doc.setPage(1);
  doc.setFillColor(...TEAL);
  doc.rect(0, 30, PAGE_W, 1.6, 'F');

  footer(doc);
  downloadBlob(`hr-reports-pack-${todayLabel()}.pdf`, doc.output('blob'));
}
