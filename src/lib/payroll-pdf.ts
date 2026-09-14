import { jsPDF } from 'jspdf';
import type { Payslip } from './types';
import { todayISO } from './payroll';
import type { PayrollRun } from './payroll';

/* ================= PDF generation (jsPDF, brand theme) ================= */

const NAVY: [number, number, number] = [23, 50, 77];
const TEAL: [number, number, number] = [15, 139, 141];
const DARK: [number, number, number] = [38, 50, 56];
const GRAY: [number, number, number] = [100, 116, 139];
const LIGHT: [number, number, number] = [234, 242, 244];
const RED_DARK: [number, number, number] = [153, 27, 27];

function pdfHeader(doc: jsPDF, title: string, subtitle: string): void {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('CodeQor HRMS', 14, 13);
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

function pdfSection(doc: jsPDF, title: string, y: number, color: [number, number, number]): number {
  doc.setFillColor(...color);
  doc.rect(14, y - 5.5, 182, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(title, 17, y);
  return y + 8;
}

function pdfAmountRow(
  doc: jsPDF,
  label: string,
  amount: number,
  y: number,
  opts?: { bold?: boolean; fill?: [number, number, number]; text?: [number, number, number] },
): number {
  if (opts?.fill) {
    doc.setFillColor(...opts.fill);
    doc.rect(14, y - 5.5, 182, 8, 'F');
  }
  doc.setTextColor(...(opts?.text || DARK));
  doc.setFont('helvetica', opts?.bold ? 'bold' : 'normal');
  doc.setFontSize(10);
  doc.text(label, 17, y);
  doc.text(`$${Math.round(amount).toLocaleString()}`, 193, y, { align: 'right' });
  return y + 8;
}

/** Single payslip as a branded PDF. */
export function payslipToPDF(slip: Payslip): Blob {
  const doc = new jsPDF();
  pdfHeader(doc, 'PAYSLIP', `${slip.month} ${slip.year}`);

  let y = 41;
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(slip.employeeName, 14, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Status: ${slip.status}   ·   Generated: ${slip.generatedOn}`, 14, y);
  y += 9;

  y = pdfSection(doc, 'EARNINGS', y, TEAL);
  y = pdfAmountRow(doc, 'Basic Salary', slip.basicSalary, y);
  for (const a of slip.allowances) y = pdfAmountRow(doc, a.name, a.amount, y);
  y = pdfAmountRow(doc, 'Gross Salary', slip.grossSalary, y, { bold: true, fill: LIGHT });

  y += 4;
  y = pdfSection(doc, 'DEDUCTIONS', y, RED_DARK);
  for (const d of slip.deductions) y = pdfAmountRow(doc, d.name, -d.amount, y);
  y += 2;
  y = pdfAmountRow(doc, 'NET SALARY', slip.netSalary, y + 2, { bold: true, fill: NAVY, text: [255, 255, 255] });

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('This is a system-generated payslip and does not require a signature.', 14, y + 8);

  pdfFooter(doc);
  return doc.output('blob');
}

/** Full payroll-run summary as a branded PDF table. */
export function runSummaryToPDF(run: PayrollRun): Blob {
  const doc = new jsPDF();
  pdfHeader(doc, 'PAYROLL SUMMARY', `${run.month} ${run.year}`);

  let y = 40;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(
    `Run ID: ${run.id}   ·   Status: ${run.status}   ·   Employees: ${run.items.length}   ·   Finalized: ${run.finalizedOn || '-'}`,
    14,
    y,
  );
  y += 9;

  const cols: { label: string; width: number; align: 'left' | 'right' }[] = [
    { label: 'Employee', width: 58, align: 'left' },
    { label: 'Basic', width: 22, align: 'right' },
    { label: 'Allow.', width: 22, align: 'right' },
    { label: 'Deduct.', width: 22, align: 'right' },
    { label: 'Leave', width: 22, align: 'right' },
    { label: 'Gross', width: 22, align: 'right' },
    { label: 'Net', width: 22, align: 'right' },
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
      else doc.text(c.label, x, yy);
      x += c.width;
    }
    return yy + 8;
  };

  y = drawHead(y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  run.items.forEach((item, idx) => {
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
      item.employeeName,
      `$${item.basicSalary.toLocaleString()}`,
      `$${item.totalAllowances.toLocaleString()}`,
      `$${item.totalDeductions.toLocaleString()}`,
      `$${item.leaveDeduction.toLocaleString()}`,
      `$${item.grossSalary.toLocaleString()}`,
      `$${item.netSalary.toLocaleString()}`,
    ];
    let x = 16;
    vals.forEach((v, ci) => {
      const c = cols[ci];
      const text = ci === 0 && v.length > 30 ? `${v.slice(0, 28)}…` : v;
      if (c.align === 'right') doc.text(text, x + c.width - 2, y, { align: 'right' });
      else doc.text(text, x, y);
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
  const totals = ['', '', '', `$${run.totalDeductions.toLocaleString()}`, '', `$${run.totalGross.toLocaleString()}`, `$${run.totalNet.toLocaleString()}`];
  let x = 16;
  doc.text('TOTALS', x, y);
  totals.forEach((v, ci) => {
    const c = cols[ci];
    if (v) doc.text(v, x + c.width - 2, y, { align: 'right' });
    x += c.width;
  });

  pdfFooter(doc);
  return doc.output('blob');
}

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
