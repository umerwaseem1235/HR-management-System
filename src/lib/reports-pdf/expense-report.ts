/**
 * Expense PDF section (`expense-claims`).
 *
 * Moved verbatim from `../reports-pdf.ts` — no behavior change.
 */

import { jsPDF } from 'jspdf';
import { mockExpenses } from '../mock-data';
import { REPORT_META } from './meta';
import { drawTable, kpiStrip, money, sectionBar, titleBlock, todayLabel } from './utils';

export function renderExpenseReport(doc: jsPDF, y: number): number {
  const meta = REPORT_META['expense-claims'];
  const total = mockExpenses.reduce((s, e) => s + e.amount, 0);
  y = titleBlock(doc, y, meta.title, 'Every claim with category, amount, date, description and approval status', `Generated ${todayLabel()} · ${mockExpenses.length} claims · ${money(total)} total`);
  y = kpiStrip(doc, y, [
    { label: 'Claims', value: String(mockExpenses.length) },
    { label: 'Total value', value: money(total) },
    { label: 'Pending', value: String(mockExpenses.filter((e) => e.status === 'Pending').length) },
    { label: 'Reimbursed', value: String(mockExpenses.filter((e) => e.status === 'Reimbursed').length) },
  ]);
  y = sectionBar(doc, y, 'CLAIMS — FULL DETAIL');
  y = drawTable(doc, y,
    [
      { label: 'Employee', width: 40, align: 'left' },
      { label: 'Category', width: 28, align: 'left' },
      { label: 'Date', width: 26, align: 'center' },
      { label: 'Description', width: 42, align: 'left' },
      { label: 'Amount', width: 24, align: 'right' },
      { label: 'Status', width: 22, align: 'center' },
    ],
    mockExpenses.map((e) => [e.employeeName, e.category, e.date, e.description, money(e.amount), e.status]),
  );
  return y;
}
