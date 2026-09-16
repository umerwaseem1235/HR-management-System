/**
 * Payroll PDF section (`payroll-summary`).
 *
 * Moved verbatim from `../reports-pdf.ts` — no behavior change.
 */

import { jsPDF } from 'jspdf';
import { mockPayslips } from '../mock-data';
import { REPORT_META } from './meta';
import { drawTable, kpiStrip, money, sectionBar, titleBlock, todayLabel } from './utils';

export function renderPayrollSummaryReport(doc: jsPDF, y: number): number {
  const meta = REPORT_META['payroll-summary'];
  const gross = mockPayslips.reduce((s, p) => s + p.grossSalary, 0);
  const net = mockPayslips.reduce((s, p) => s + p.netSalary, 0);
  y = titleBlock(doc, y, meta.title, 'Monthly payroll with basic, allowances, deductions, gross and net per employee', `Generated ${todayLabel()} · ${mockPayslips.length} payslips`);
  y = kpiStrip(doc, y, [
    { label: 'Payslips', value: String(mockPayslips.length) },
    { label: 'Total gross', value: money(gross) },
    { label: 'Total net', value: money(net) },
    { label: 'Avg net', value: money(net / Math.max(1, mockPayslips.length)) },
  ]);
  y = sectionBar(doc, y, 'PAYSLIPS — FULL DETAIL');
  y = drawTable(doc, y,
    [
      { label: 'Employee', width: 50, align: 'left' },
      { label: 'Period', width: 32, align: 'center' },
      { label: 'Basic', width: 24, align: 'right' },
      { label: 'Gross', width: 26, align: 'right' },
      { label: 'Net', width: 26, align: 'right' },
      { label: 'Status', width: 24, align: 'center' },
    ],
    mockPayslips.map((p) => [p.employeeName, `${p.month.slice(0, 3)} ${p.year}`, money(p.basicSalary), money(p.grossSalary), money(p.netSalary), p.status]),
  );
  return y;
}
