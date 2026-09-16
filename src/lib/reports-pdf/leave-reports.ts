/**
 * Leave-family PDF sections (`leave-balance`, `leave-utilization`).
 *
 * Moved verbatim from `../reports-pdf.ts` — no behavior change.
 */

import { jsPDF } from 'jspdf';
import { mockLeaveBalances, mockLeaveRequests } from '../mock-data';
import { REPORT_META } from './meta';
import { drawTable, groupCount, kpiStrip, sectionBar, titleBlock, todayLabel } from './utils';

export function renderLeaveBalanceReport(doc: jsPDF, y: number): number {
  const meta = REPORT_META['leave-balance'];
  y = titleBlock(doc, y, meta.title, 'Leave entitlement, usage and pending balances across all leave types', `Generated ${todayLabel()} · ${mockLeaveBalances.length} leave types · ${mockLeaveRequests.length} requests`);
  y = kpiStrip(doc, y, [
    { label: 'Leave types', value: String(mockLeaveBalances.length) },
    { label: 'Total entitled', value: String(mockLeaveBalances.reduce((s, b) => s + b.total, 0)) },
    { label: 'Total used', value: String(mockLeaveBalances.reduce((s, b) => s + b.used, 0)) },
    { label: 'Pending', value: String(mockLeaveBalances.reduce((s, b) => s + b.pending, 0)) },
  ]);
  y = sectionBar(doc, y, 'BALANCES BY LEAVE TYPE — FULL DETAIL');
  y = drawTable(doc, y,
    [
      { label: 'Leave type', width: 62, align: 'left' },
      { label: 'Total', width: 30, align: 'center' },
      { label: 'Used', width: 30, align: 'center' },
      { label: 'Remaining', width: 30, align: 'center' },
      { label: 'Pending', width: 30, align: 'center' },
    ],
    mockLeaveBalances.map((b) => [b.leaveType, String(b.total), String(b.used), String(b.remaining), String(b.pending)]),
  );
  y = sectionBar(doc, y, 'UNDERLYING REQUESTS');
  y = drawTable(doc, y,
    [
      { label: 'Employee', width: 42, align: 'left' },
      { label: 'Type', width: 36, align: 'left' },
      { label: 'Period', width: 50, align: 'left' },
      { label: 'Days', width: 18, align: 'center' },
      { label: 'Status', width: 36, align: 'center' },
    ],
    mockLeaveRequests.map((r) => [r.employeeName, r.leaveType, `${r.startDate} → ${r.endDate}`, String(r.days), r.status]),
  );
  return y;
}

export function renderLeaveUtilizationReport(doc: jsPDF, y: number): number {
  const meta = REPORT_META['leave-utilization'];
  const approved = mockLeaveRequests.filter((r) => r.status === 'Approved').length;
  const totalDays = mockLeaveRequests.reduce((s, r) => s + r.days, 0);
  const byType = groupCount(mockLeaveRequests, (r) => r.leaveType);
  y = titleBlock(doc, y, meta.title, 'Leave usage patterns, approval mix and trends by type', `Generated ${todayLabel()} · ${mockLeaveRequests.length} requests · ${totalDays} days`);
  y = kpiStrip(doc, y, [
    { label: 'Requests', value: String(mockLeaveRequests.length) },
    { label: 'Days requested', value: String(totalDays) },
    { label: 'Approved', value: String(approved) },
    { label: 'Top type', value: byType[0]?.label.split(' ')[0] ?? '-' },
  ]);
  y = sectionBar(doc, y, 'UTILIZATION BY TYPE');
  y = drawTable(doc, y,
    [
      { label: 'Leave type', width: 70, align: 'left' },
      { label: 'Requests', width: 36, align: 'center' },
      { label: 'Days', width: 36, align: 'center' },
      { label: 'Share', width: 40, align: 'right' },
    ],
    byType.map((t) => {
      const days = mockLeaveRequests.filter((r) => r.leaveType === t.label).reduce((s, r) => s + r.days, 0);
      return [t.label, String(t.count), String(days), `${Math.round((t.count / mockLeaveRequests.length) * 100)}%`];
    }),
  );
  y = sectionBar(doc, y, 'ALL REQUESTS — FULL DETAIL');
  y = drawTable(doc, y,
    [
      { label: 'Employee', width: 40, align: 'left' },
      { label: 'Type', width: 34, align: 'left' },
      { label: 'Dates', width: 48, align: 'left' },
      { label: 'Reason', width: 36, align: 'left' },
      { label: 'Status', width: 24, align: 'center' },
    ],
    mockLeaveRequests.map((r) => [r.employeeName, r.leaveType, `${r.startDate}→${r.endDate} (${r.days}d)`, r.reason, r.status]),
  );
  return y;
}
