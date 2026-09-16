/**
 * Directory & headcount PDF sections.
 *
 * Moved verbatim from `../reports-pdf.ts` (`employee-master` and `headcount`
 * cases of `addReportContent`, plus the `employeeDetailBlocks` helper).
 * No behavior change.
 */

import { jsPDF } from 'jspdf';
import { mockEmployees } from '../mock-data';
import { REPORT_META } from './meta';
import {
  CONTENT_W,
  DARK,
  GRAY,
  MARGIN,
  NAVY,
  WHITE,
  drawTable,
  ensureSpace,
  groupCount,
  kpiStrip,
  sectionBar,
  titleBlock,
  todayLabel,
} from './utils';

/** Full employee profiles — this is what makes the export "all details". */
function employeeDetailBlocks(doc: jsPDF, y: number): number {
  for (const e of mockEmployees) {
    y = ensureSpace(doc, y, 34);
    doc.setFillColor(...WHITE);
    doc.setDrawColor(214, 228, 232);
    doc.setLineWidth(0.3);
    doc.roundedRect(MARGIN, y - 6, CONTENT_W, 30, 1.5, 1.5, 'FD');
    doc.setTextColor(...NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(`${e.firstName} ${e.lastName}  ·  ${e.employeeCode}`, MARGIN + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(`${e.designation} — ${e.department} · ${e.branch} · ${e.status}`, MARGIN + 4, y + 5);
    doc.setTextColor(...DARK);
    doc.setFontSize(7.8);
    doc.text(`Email: ${e.email}      Phone: ${e.phone}`, MARGIN + 4, y + 10.5);
    doc.text(`Joining: ${e.joiningDate}      Type: ${e.employmentType}      Shift: ${e.shift}`, MARGIN + 4, y + 15.5);
    doc.text(`Manager: ${e.reportingManager}      Location: ${e.city}, ${e.country}`, MARGIN + 4, y + 20.5);
    y += 34;
  }
  return y;
}

export function renderEmployeeMasterReport(doc: jsPDF, y: number): number {
  const meta = REPORT_META['employee-master'];
  y = titleBlock(doc, y, meta.title, 'Complete employee directory with contact, role and employment details', `Generated ${todayLabel()} · ${mockEmployees.length} employees · All branches & departments`);
  const active = mockEmployees.filter((e) => e.status === 'Active').length;
  y = kpiStrip(doc, y, [
    { label: 'Total staff', value: String(mockEmployees.length) },
    { label: 'Active', value: String(active) },
    { label: 'Departments', value: String(new Set(mockEmployees.map((e) => e.department)).size) },
    { label: 'Branches', value: String(new Set(mockEmployees.map((e) => e.branch)).size) },
  ]);
  y = sectionBar(doc, y, `DIRECTORY — ALL ${mockEmployees.length} EMPLOYEES`);
  y = drawTable(
    doc, y,
    [
      { label: 'Code', width: 24, align: 'left' },
      { label: 'Name', width: 44, align: 'left' },
      { label: 'Department', width: 40, align: 'left' },
      { label: 'Designation', width: 44, align: 'left' },
      { label: 'Branch', width: 30, align: 'left' },
    ],
    mockEmployees.map((e) => [e.employeeCode, `${e.firstName} ${e.lastName}`, e.department, e.designation, e.status]),
  );
  y = sectionBar(doc, y, 'FULL EMPLOYEE DETAILS');
  y = employeeDetailBlocks(doc, y);
  return y;
}

export function renderHeadcountReport(doc: jsPDF, y: number): number {
  const meta = REPORT_META['headcount'];
  const byDept = groupCount(mockEmployees, (e) => e.department);
  const byBranch = groupCount(mockEmployees, (e) => e.branch);
  const byStatus = groupCount(mockEmployees, (e) => e.status);
  y = titleBlock(doc, y, meta.title, 'Employee count by department, designation, branch and status', `Generated ${todayLabel()} · ${mockEmployees.length} employees`);
  y = kpiStrip(doc, y, [
    { label: 'Headcount', value: String(mockEmployees.length) },
    { label: 'Departments', value: String(byDept.length) },
    { label: 'Branches', value: String(byBranch.length) },
    { label: 'Largest dept', value: byDept[0]?.label.split(' ')[0] ?? '-' },
  ]);
  y = sectionBar(doc, y, 'BY DEPARTMENT');
  y = drawTable(doc, y,
    [
      { label: 'Department', width: 90, align: 'left' },
      { label: 'Count', width: 46, align: 'center' },
      { label: 'Share', width: 46, align: 'right' },
    ],
    byDept.map((d) => [d.label, String(d.count), `${Math.round((d.count / mockEmployees.length) * 100)}%`]),
  );
  y = sectionBar(doc, y, 'BY BRANCH');
  y = drawTable(doc, y,
    [
      { label: 'Branch', width: 90, align: 'left' },
      { label: 'Count', width: 46, align: 'center' },
      { label: 'Share', width: 46, align: 'right' },
    ],
    byBranch.map((d) => [d.label, String(d.count), `${Math.round((d.count / mockEmployees.length) * 100)}%`]),
  );
  y = sectionBar(doc, y, 'BY EMPLOYMENT STATUS');
  y = drawTable(doc, y,
    [
      { label: 'Status', width: 90, align: 'left' },
      { label: 'Count', width: 46, align: 'center' },
      { label: 'Share', width: 46, align: 'right' },
    ],
    byStatus.map((d) => [d.label, String(d.count), `${Math.round((d.count / mockEmployees.length) * 100)}%`]),
  );
  return y;
}
