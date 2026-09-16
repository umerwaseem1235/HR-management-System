/**
 * Performance PDF section (`performance-reviews`).
 *
 * Moved verbatim from `../reports-pdf.ts` — no behavior change.
 */

import { jsPDF } from 'jspdf';
import { mockPerformanceReviews } from '../mock-data';
import { REPORT_META } from './meta';
import { drawTable, kpiStrip, sectionBar, titleBlock, todayLabel } from './utils';

export function renderPerformanceReport(doc: jsPDF, y: number): number {
  const meta = REPORT_META['performance-reviews'];
  const done = mockPerformanceReviews.filter((r) => r.status === 'Completed').length;
  y = titleBlock(doc, y, meta.title, 'Review completion, self vs manager ratings and reviewer comments', `Generated ${todayLabel()} · ${mockPerformanceReviews.length} reviews`);
  y = kpiStrip(doc, y, [
    { label: 'Reviews', value: String(mockPerformanceReviews.length) },
    { label: 'Completed', value: String(done) },
    { label: 'Pending', value: String(mockPerformanceReviews.length - done) },
    { label: 'Cycle', value: mockPerformanceReviews[0]?.cycleName ?? '-' },
  ]);
  y = sectionBar(doc, y, 'REVIEWS — FULL DETAIL');
  y = drawTable(doc, y,
    [
      { label: 'Employee', width: 44, align: 'left' },
      { label: 'Cycle', width: 28, align: 'center' },
      { label: 'Self', width: 20, align: 'center' },
      { label: 'Manager', width: 24, align: 'center' },
      { label: 'Status', width: 40, align: 'center' },
      { label: 'Comment', width: 26, align: 'left' },
    ],
    mockPerformanceReviews.map((r) => [r.employeeName, r.cycleName, r.selfRating ? String(r.selfRating) : '-', r.managerRating ? String(r.managerRating) : '-', r.status, r.comments ? (r.comments.length > 18 ? `${r.comments.slice(0, 17)}…` : r.comments) : '-']),
  );
  return y;
}
