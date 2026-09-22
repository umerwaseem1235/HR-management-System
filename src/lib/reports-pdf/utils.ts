/**
 * Shared jsPDF building blocks for every HR report.
 *
 * Moved verbatim from `../reports-pdf.ts` — brand theme, page geometry,
 * header/footer/title/KPI/section/table primitives and small formatters.
 * Previously module-private; now exported so the per-report modules
 * (`attendance-report`, `progress-report`, …) can share them.
 * No behavior change.
 */

import { jsPDF } from 'jspdf';

/* ================= Brand theme (matches payroll PDFs) ================= */

export const NAVY: [number, number, number] = [23, 50, 77];
export const BLUE: [number, number, number] = [2, 79, 167];
export const TEAL: [number, number, number] = [15, 139, 141];
export const DARK: [number, number, number] = [38, 50, 56];
export const GRAY: [number, number, number] = [100, 116, 139];
export const LIGHT: [number, number, number] = [234, 242, 244];
export const WHITE: [number, number, number] = [255, 255, 255];

export const PAGE_W = 210;
export const MARGIN = 14;
export const CONTENT_W = PAGE_W - MARGIN * 2;
export const BOTTOM = 272;

export function todayLabel(): string {
  return new Date().toISOString().slice(0, 10);
}

export function header(doc: jsPDF, eyebrow: string, title: string): void {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, 30, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('CodQor HRMS', MARGIN, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Human Resource Management', MARGIN, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title.toUpperCase(), PAGE_W - MARGIN, 13, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(eyebrow, PAGE_W - MARGIN, 20, { align: 'right' });
}

export function footer(doc: jsPDF): void {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    doc.text(
      `Confidential · System-generated · ${todayLabel()} · Page ${i} of ${pages}`,
      PAGE_W / 2,
      290,
      { align: 'center' },
    );
  }
}

export function titleBlock(
  doc: jsPDF,
  y: number,
  title: string,
  subtitle: string,
  meta: string,
): number {
  doc.setTextColor(...DARK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, MARGIN, y);
  y += 6.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(subtitle, MARGIN, y);
  y += 5;
  doc.setFontSize(8.5);
  doc.text(meta, MARGIN, y);
  y += 3;
  doc.setDrawColor(...NAVY);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  return y + 7;
}

export function kpiStrip(doc: jsPDF, y: number, kpis: { label: string; value: string }[]): number {
  const gap = 3;
  const w = (CONTENT_W - gap * (kpis.length - 1)) / kpis.length;
  let x = MARGIN;
  for (const kpi of kpis) {
    doc.setFillColor(...LIGHT);
    doc.roundedRect(x, y - 6, w, 15, 1.5, 1.5, 'F');
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(kpi.label.toUpperCase(), x + 3, y - 1.5);
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(kpi.value, x + 3, y + 5);
    x += w + gap;
  }
  return y + 14;
}

export function sectionBar(doc: jsPDF, y: number, title: string): number {
  y = ensureSpace(doc, y, 14);
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN, y - 5.5, CONTENT_W, 8, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(title, MARGIN + 3, y);
  return y + 8;
}

export function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > BOTTOM) {
    doc.addPage();
    return 20;
  }
  return y;
}

export interface Col {
  label: string;
  width: number;
  align: 'left' | 'right' | 'center';
}

export function scaleCols(cols: Col[]): Col[] {
  const total = cols.reduce((s, c) => s + c.width, 0);
  if (Math.abs(total - CONTENT_W) < 0.01) return cols;
  return cols.map((c) => ({ ...c, width: (c.width / total) * CONTENT_W }));
}

export function drawTable(doc: jsPDF, y: number, cols: Col[], rows: string[][]): number {
  const columns = scaleCols(cols);
  const fontSize = 8;
  const lineH = 4.2;
  const rowPadTop = 3;
  const rowPadBottom = 2.5;
  const drawHead = (yy: number) => {
    doc.setFillColor(...BLUE);
    doc.rect(MARGIN, yy - 5.5, CONTENT_W, 8, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    let x = MARGIN + 2;
    for (const c of columns) {
      if (c.align === 'right') doc.text(c.label, x + c.width - 2, yy, { align: 'right' });
      else if (c.align === 'center') doc.text(c.label, x + c.width / 2 - 1, yy, { align: 'center' });
      else doc.text(c.label, x, yy);
      x += c.width;
    }
    return yy + 8;
  };

  y = ensureSpace(doc, y, 16);
  y = drawHead(y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);

  rows.forEach((row, idx) => {
    // Wrap each cell inside its column so full notes print on
    // multiple lines instead of being cut off with "…".
    const wrapped: string[][] = row.map((cell, ci) => {
      const c = columns[ci];
      const maxW = Math.max(10, c.width - 4);
      const clean = sanitizePdfText(String(cell ?? '')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\s+/g, ' ')
        .trim());
      if (!clean) return ['-'];
      try {
        const lines = doc.splitTextToSize(clean, maxW) as string[];
        return lines.length > 0 ? lines : ['-'];
      } catch {
        return [clean];
      }
    });
    const lineCount = Math.max(1, ...wrapped.map((w) => w.length));
    const rowH = rowPadTop + lineCount * lineH + rowPadBottom;

    if (y + rowH > BOTTOM) {
      doc.addPage();
      y = 20;
      y = drawHead(y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
    }
    if (idx % 2 === 1) {
      doc.setFillColor(...LIGHT);
      doc.rect(MARGIN, y - 5.5, CONTENT_W, rowH, 'F');
    }
    doc.setTextColor(...DARK);
    let x = MARGIN + 2;
    row.forEach((_cell, ci) => {
      const c = columns[ci];
      const lines = wrapped[ci];
      lines.forEach((ln, li) => {
        const ly = y - 1 + li * lineH;
        if (c.align === 'right') doc.text(ln, x + c.width - 2, ly, { align: 'right' });
        else if (c.align === 'center') doc.text(ln, x + c.width / 2 - 1, ly, { align: 'center' });
        else doc.text(ln, x, ly);
      });
      x += c.width;
    });
    y += rowH;
  });
  return y + 4;
}

export function money(n: number): string {
  return `PKR ${Math.round(n).toLocaleString()}`;
}

export function groupCount<T>(items: T[], key: (t: T) => string): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) map.set(key(item), (map.get(key(item)) || 0) + 1);
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

/** jsPDF standard fonts (helvetica) cannot render emoji — strip them so
 *  PDFs show clean text instead of mojibake like "Ø=Þ€". */
export function sanitizePdfText(s: string): string {
  return s
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{1F1E6}-\u{1F1FF}\u{2690}-\u{2695}\u{2640}-\u{2642}\u{25A0}-\u{25FF}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function plainNote(html: string): string {
  return sanitizePdfText(html
    .replace(/<(br|p|div|li|h1|h2|h3)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim());
}
