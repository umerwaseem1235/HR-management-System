/**
 * Audit PDF section (`audit-log`).
 *
 * Moved verbatim from `../reports-pdf.ts` — no behavior change.
 */

import { jsPDF } from 'jspdf';
import { mockAuditLogs } from '../mock-data';
import { REPORT_META } from './meta';
import { drawTable, kpiStrip, sectionBar, titleBlock, todayLabel } from './utils';

export function renderAuditReport(doc: jsPDF, y: number): number {
  const meta = REPORT_META['audit-log'];
  y = titleBlock(doc, y, meta.title, 'System activity with actor, module, action and before/after values', `Generated ${todayLabel()} · ${mockAuditLogs.length} events`);
  y = kpiStrip(doc, y, [
    { label: 'Events', value: String(mockAuditLogs.length) },
    { label: 'Actors', value: String(new Set(mockAuditLogs.map((a) => a.userName)).size) },
    { label: 'Modules', value: String(new Set(mockAuditLogs.map((a) => a.module)).size) },
    { label: 'Latest', value: mockAuditLogs[0]?.timestamp.slice(0, 10) ?? '-' },
  ]);
  y = sectionBar(doc, y, 'ACTIVITY — FULL DETAIL');
  y = drawTable(doc, y,
    [
      { label: 'User', width: 36, align: 'left' },
      { label: 'Module', width: 28, align: 'left' },
      { label: 'Action', width: 28, align: 'left' },
      { label: 'Record', width: 34, align: 'left' },
      { label: 'Change', width: 30, align: 'left' },
      { label: 'Time', width: 26, align: 'center' },
    ],
    mockAuditLogs.map((a) => [a.userName, a.module, a.action, a.record, a.previousValue ? `${a.previousValue}→${a.newValue ?? ''}` : '-', a.timestamp.slice(0, 10)]),
  );
  return y;
}
