import { jsPDF } from 'jspdf';
import type { ExpenseClaim } from './types';
import { todayISO } from './payroll';

/* ================= Expense report PDF (jsPDF, brand theme) ================= */

const NAVY: [number, number, number] = [23, 50, 77];
const TEAL: [number, number, number] = [15, 139, 141];
const DARK: [number, number, number] = [38, 50, 56];
const GRAY: [number, number, number] = [100, 116, 139];
const LIGHT: [number, number, number] = [234, 242, 244];

function pdfHeader(doc: jsPDF, title: string, subtitle: string): void {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CodQor HRMS', 14, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Human Resource Management', 14, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(title, 196, 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(subtitle, 196, 21, { align: 'right' });
}

function pdfFooter(doc: jsPDF): void {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`System-generated document · ${todayISO()} · Page ${i} of ${pages}`, 105, 290, { align: 'center' });
  }
}

function pdfSection(doc: jsPDF, title: string, y: number): number {
  doc.setFillColor(...TEAL);
  doc.rect(14, y - 5.5, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(title, 17, y);
  return y + 8;
}

/** Expense claims report for a given period — branded PDF table. */
export function expenseReportToPDF(claims: ExpenseClaim[], periodLabel: string): Blob {
  const doc = new jsPDF();
  pdfHeader(doc, 'EXPENSE REPORT', periodLabel);

  const total = claims.reduce((s, c) => s + c.amount, 0);
  const sumBy = (status: ExpenseClaim['status']) =>
    claims.filter((c) => c.status === status).reduce((s, c) => s + c.amount, 0);

  let y = 40;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(
    `Period: ${periodLabel}   ·   Claims: ${claims.length}   ·   Generated: ${todayISO()}`,
    14,
    y,
  );
  y += 9;

  y = pdfSection(doc, 'SUMMARY', y);
  const summary: Array<[string, string]> = [
    ['Total claimed', `PKR ${Math.round(total).toLocaleString()}`],
    ['Pending', `PKR ${Math.round(sumBy('Pending')).toLocaleString()}`],
    ['Approved', `PKR ${Math.round(sumBy('Approved')).toLocaleString()}`],
    ['Reimbursed', `PKR ${Math.round(sumBy('Reimbursed')).toLocaleString()}`],
  ];
  doc.setFontSize(10);
  for (const [label, value] of summary) {
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 17, y);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 193, y, { align: 'right' });
    y += 7;
  }
  y += 4;

  y = pdfSection(doc, 'CLAIMS', y);

  const cols: { label: string; width: number; align: 'left' | 'right' | 'center' }[] = [
    { label: 'Employee', width: 42, align: 'left' },
    { label: 'Category', width: 28, align: 'left' },
    { label: 'Date', width: 26, align: 'center' },
    { label: 'Description', width: 44, align: 'left' },
    { label: 'Amount', width: 24, align: 'right' },
    { label: 'Status', width: 18, align: 'center' },
  ];

  const drawHead = (yy: number) => {
    doc.setFillColor(...NAVY);
    doc.rect(14, yy - 5.5, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    let x = 16;
    for (const c of cols) {
      if (c.align === 'right') doc.text(c.label, x + c.width - 2, yy, { align: 'right' });
      else if (c.align === 'center') doc.text(c.label, x + c.width / 2, yy, { align: 'center' });
      else doc.text(c.label, x, yy);
      x += c.width;
    }
    return yy + 8;
  };

  y = drawHead(y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  const rows = [...claims].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  if (rows.length === 0) {
    doc.setTextColor(...GRAY);
    doc.text('No expense claims for this period.', 16, y);
    y += 7;
  }
  rows.forEach((claim, idx) => {
    if (y > 262) {
      doc.addPage();
      y = 20;
      y = drawHead(y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
    }
    if (idx % 2 === 1) {
      doc.setFillColor(...LIGHT);
      doc.rect(14, y - 5.5, 182, 7.5, 'F');
    }
    doc.setTextColor(...DARK);
    const vals = [
      claim.employeeName.length > 24 ? `${claim.employeeName.slice(0, 22)}…` : claim.employeeName,
      claim.category,
      claim.date,
      claim.description.length > 30 ? `${claim.description.slice(0, 28)}…` : claim.description,
      `PKR ${Math.round(claim.amount).toLocaleString()}`,
      claim.status,
    ];
    let x = 16;
    vals.forEach((v, ci) => {
      const c = cols[ci];
      if (c.align === 'right') doc.text(v, x + c.width - 2, y, { align: 'right' });
      else if (c.align === 'center') doc.text(v, x + c.width / 2, y, { align: 'center' });
      else doc.text(v, x, y);
      x += c.width;
    });
    y += 7.5;
  });

  y += 2;
  doc.setDrawColor(...NAVY);
  doc.line(14, y - 4, 196, y - 4);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...NAVY);
  doc.text('TOTAL', 16, y);
  doc.text(`PKR ${Math.round(total).toLocaleString()}`, 194, y, { align: 'right' });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('This is a system-generated report and does not require a signature.', 14, y + 8);

  pdfFooter(doc);
  return doc.output('blob');
}
