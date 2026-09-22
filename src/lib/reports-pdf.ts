/**
 * Compatibility shim — DO NOT ADD CODE HERE.
 *
 * The report library now lives in `./reports-pdf/` (see `./reports-pdf/index.ts`
 * for the public barrel). This file re-exports it so every existing import of
 * `lib/reports-pdf` (e.g. `app/reports/page.tsx`, `components/reports/ExportLibrary.tsx`)
 * keeps working with zero changes and identical runtime behavior.
 */

export type ReportId =
  | 'employee-master'
  | 'headcount'
  | 'attendance'
  | 'late-early'
  | 'leave-balance'
  | 'leave-utilization'
  | 'payroll-summary'
  | 'recruitment-pipeline'
  | 'performance-reviews'
  | 'expense-claims'
  | 'audit-log'
  | 'progress';

/** The four reports surfaced in the Export Library UI (and the PDF pack). */
export const LIBRARY_REPORT_IDS: ReportId[] = ['attendance', 'progress', 'payroll-summary', 'expense-claims'];

export const REPORT_META: Record<ReportId, { fileSlug: string; title: string; category: string }> = {
  'employee-master': { fileSlug: 'employee-master-report', title: 'Employee Master Report', category: 'HR' },
  'headcount': { fileSlug: 'headcount-report', title: 'Headcount Report', category: 'HR' },
  'attendance': { fileSlug: 'attendance-report', title: 'Attendance Report', category: 'Attendance' },
  'late-early': { fileSlug: 'late-early-report', title: 'Late & Early Report', category: 'Attendance' },
  'leave-balance': { fileSlug: 'leave-balance-report', title: 'Leave Balance Report', category: 'Leave' },
  'leave-utilization': { fileSlug: 'leave-utilization-report', title: 'Leave Utilization Report', category: 'Leave' },
  'payroll-summary': { fileSlug: 'payroll-summary-report', title: 'Payroll Summary', category: 'Payroll' },
  'recruitment-pipeline': { fileSlug: 'recruitment-pipeline-report', title: 'Recruitment Pipeline', category: 'Recruitment' },
  'performance-reviews': { fileSlug: 'performance-reviews-report', title: 'Performance Reviews', category: 'Performance' },
  'expense-claims': { fileSlug: 'expense-claims-report', title: 'Expense Claims Report', category: 'Finance' },
  'audit-log': { fileSlug: 'audit-activity-log', title: 'Audit Activity Log', category: 'Security' },
  'progress': { fileSlug: 'progress-report', title: 'Progress Report', category: 'Progress' },
};

/* ================= Brand theme (matches payroll PDFs) ================= */

const NAVY: [number, number, number] = [23, 50, 77];
const BLUE: [number, number, number] = [2, 79, 167];
const TEAL: [number, number, number] = [15, 139, 141];
const DARK: [number, number, number] = [38, 50, 56];
const GRAY: [number, number, number] = [100, 116, 139];
const LIGHT: [number, number, number] = [234, 242, 244];
const WHITE: [number, number, number] = [255, 255, 255];

const MARGIN = 14;
const PAGE_W = 210;
const INNER_W = PAGE_W - 2 * MARGIN;
const ROW_H = 6;
const HEADER_H = 7;

import { jsPDF } from 'jspdf';

function rgb(doc: any, c: [number, number, number]) { doc.setTextColor(c[0], c[1], c[2]); }
function rgbFill(doc: any, c: [number, number, number]) { doc.setFillColor(c[0], c[1], c[2]); }

function header(doc: any, eyebrow: string, title: string): void {
  const top = 6;
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, 24, 'F');
  doc.setTextColor(...WHITE);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('CodQor HRMS', MARGIN, 12);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(title, MARGIN, 18);
  if (eyebrow) {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(eyebrow, PAGE_W - MARGIN - doc.getTextWidth(eyebrow), 12);
  }
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, 25, PAGE_W - MARGIN, 25);
}

function footer(doc: any): void {
  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  rgb(doc, GRAY);
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const today = new Date().toLocaleDateString('en-GB');
    doc.text(`CodQor HRMS — ${today} — Page ${i} of ${pageCount}`, MARGIN, 285);
  }
}

function ensureSpace(doc: any, y: number, needed: number): number {
  if (y + needed > 270) {
    doc.addPage();
    header(doc, '', '');
    return 32;
  }
  return y;
}

function titleBlock(doc: any, y: number, title: string, subtitle?: string, meta?: string): number {
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  rgb(doc, NAVY);
  doc.text(title, MARGIN, y);
  y += 7;
  if (subtitle) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    rgb(doc, GRAY);
    doc.text(subtitle, MARGIN, y);
    y += 5;
  }
  if (meta) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text(meta, MARGIN, y);
    y += 5;
  }
  return y;
}

function kpiStrip(doc: any, y: number, kpis: { label: string; value: string }[]): number {
  const pad = 12;
  const boxW = (INNER_W - (kpis.length - 1) * 4) / kpis.length;
  kpis.forEach((kpi, i) => {
    const x = MARGIN + i * (boxW + 4);
    doc.setFillColor(...LIGHT);
    doc.roundedRect(x, y, boxW, 18, 2, 2, 'F');
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    rgb(doc, GRAY);
    doc.text(kpi.label, x + pad, y + 6);
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    rgb(doc, NAVY);
    doc.text(kpi.value, x + pad, y + 14);
  });
  return y + 22;
}

function sectionBar(doc: any, y: number, title: string): number {
  doc.setFillColor(...BLUE);
  doc.rect(MARGIN, y, INNER_W, 9, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  rgb(doc, WHITE);
  doc.text(title, MARGIN + 3, y + 6);
  return y + 12;
}

function cleanCell(val: unknown): string {
  return String(val ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // jsPDF standard fonts (helvetica) cannot render emoji — they print
    // as mojibake like "Ø=Þ€". Strip them so notes stay readable.
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{2690}-\u{2695}\u{2640}-\u{2642}\u{25A0}-\u{25FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function drawTable(
  doc: any,
  y: number,
  cols: { label: string; width: number; align: 'left' | 'right' | 'center' }[],
  rows: (string | number)[][],
): number {
  const xStart = MARGIN;
  const fontSize = 6.5;
  const lineH = 4;
  const cellPadX = 2;
  const rowPadTop = 2.5;
  const rowPadBottom = 2;

  const drawHead = (yy: number): number => {
    doc.setFillColor(...NAVY);
    doc.rect(xStart, yy, INNER_W, HEADER_H, 'F');
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    rgb(doc, WHITE);
    let x = xStart;
    cols.forEach((c) => {
      const tx = c.align === 'center' ? x + c.width / 2 : c.align === 'right' ? x + c.width - 2 : x + 2;
      doc.text(c.label, tx, yy + 5, { align: c.align });
      x += c.width;
    });
    return yy + HEADER_H;
  };

  y = ensureSpace(doc, y, HEADER_H + 10);
  y = drawHead(y);

  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'normal');

  rows.forEach((row, ri) => {
    // Wrap every cell inside its column width so long notes never
    // overflow / get clipped — row grows to fit the tallest cell.
    const wrapped: string[][] = row.map((cell, ci) => {
      const c = cols[ci];
      const maxW = Math.max(10, c.width - cellPadX * 2);
      const clean = cleanCell(cell);
      if (!clean) return [''];
      try {
        const lines = doc.splitTextToSize(clean, maxW) as string[];
        return lines.length > 0 ? lines : [''];
      } catch {
        return [clean];
      }
    });
    const lineCount = Math.max(1, ...wrapped.map((w) => w.length));
    const rowH = rowPadTop + lineCount * lineH + rowPadBottom;

    if (y + rowH > 270) {
      doc.addPage();
      header(doc, '', '');
      y = 32;
      y = drawHead(y);
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal');
    }
    if (ri % 2 === 1) {
      doc.setFillColor(245, 248, 250);
      doc.rect(xStart, y, INNER_W, rowH, 'F');
    }
    let x = xStart;
    row.forEach((_cell, ci) => {
      const c = cols[ci];
      const lines = wrapped[ci];
      rgb(doc, ri % 2 === 0 ? DARK : NAVY);
      lines.forEach((ln, li) => {
        const ly = y + rowPadTop + li * lineH;
        const tx = c.align === 'center' ? x + c.width / 2 : c.align === 'right' ? x + c.width - 2 : x + 2;
        doc.text(ln, tx, ly, { align: c.align });
      });
      x += c.width;
    });
    y += rowH;
  });
  return y;
}

interface TabReportSpec {
  eyebrow: string;
  title: string;
  subtitle?: string;
  meta?: string;
  kpis: { label: string; value: string }[];
  sectionTitle: string;
  cols: { label: string; width: number; align: 'left' | 'right' | 'center' }[];
  rows: (string | number)[][];
  fileSlug: string;
}

function todayLabel(): string {
  return new Date().toISOString().slice(0, 10);
}

function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Download a PDF of the currently visible report tab (respects filters). */
export function downloadTabReport(spec: TabReportSpec): void {
  const doc = new jsPDF();
  header(doc, spec.eyebrow, spec.title);
  let y = 40;
  y = titleBlock(doc, y, spec.title, spec.subtitle, spec.meta);
  if (spec.kpis.length > 0) y = kpiStrip(doc, y, spec.kpis);
  y = sectionBar(doc, y, spec.sectionTitle);
  y = drawTable(doc, y, spec.cols, spec.rows);

  // Disclaimer sits safely below the table with a gap — never on top of a row.
  y += 6;
  y = ensureSpace(doc, y, 14);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  const disclaimer = 'This is a system-generated report from CodQor HRMS and does not require a signature.';
  let discLines: string[] = [disclaimer];
  try {
    discLines = doc.splitTextToSize(disclaimer, INNER_W) as string[];
  } catch {
    // keep single line fallback
  }
  discLines.forEach((ln: string, i: number) => {
    doc.text(ln, MARGIN, y + i * 4);
  });
  y += discLines.length * 4;

  footer(doc);
  downloadBlob(`${spec.fileSlug}-${todayLabel()}.pdf`, doc.output('blob'));
}