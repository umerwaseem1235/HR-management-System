import { jsPDF } from 'jspdf';
import {
  mockEmployees,
  mockAttendance,
  mockLeaveRequests,
  mockLeaveBalances,
  mockPayslips,
  mockJobs,
  mockCandidates,
  mockPerformanceReviews,
  mockExpenses,
  mockAuditLogs,
} from './mock-data';
import { downloadBlob } from './payroll-pdf';

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
  | 'audit-log';

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
};

/* ================= Brand theme (matches payroll PDFs) ================= */

const NAVY: [number, number, number] = [23, 50, 77];
const BLUE: [number, number, number] = [2, 79, 167];
const TEAL: [number, number, number] = [15, 139, 141];
const DARK: [number, number, number] = [38, 50, 56];
const GRAY: [number, number, number] = [100, 116, 139];
const LIGHT: [number, number, number] = [234, 242, 244];
const WHITE: [number, number, number] = [255, 255, 255];

const PAGE_W = 210;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = 272;

function todayLabel(): string {
  return new Date().toISOString().slice(0, 10);
}

function header(doc: jsPDF, eyebrow: string, title: string): void {
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, 30, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('CodeQor HRMS', MARGIN, 13);
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

function footer(doc: jsPDF): void {
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

function titleBlock(
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

function kpiStrip(doc: jsPDF, y: number, kpis: { label: string; value: string }[]): number {
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

function sectionBar(doc: jsPDF, y: number, title: string): number {
  y = ensureSpace(doc, y, 14);
  doc.setFillColor(...NAVY);
  doc.rect(MARGIN, y - 5.5, CONTENT_W, 8, 'F');
  doc.setTextColor(...WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(title, MARGIN + 3, y);
  return y + 8;
}

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > BOTTOM) {
    doc.addPage();
    return 20;
  }
  return y;
}

interface Col {
  label: string;
  width: number;
  align: 'left' | 'right' | 'center';
}

function scaleCols(cols: Col[]): Col[] {
  const total = cols.reduce((s, c) => s + c.width, 0);
  if (Math.abs(total - CONTENT_W) < 0.01) return cols;
  return cols.map((c) => ({ ...c, width: (c.width / total) * CONTENT_W }));
}

function drawTable(doc: jsPDF, y: number, cols: Col[], rows: string[][]): number {
  const columns = scaleCols(cols);
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
  doc.setFontSize(8);

  rows.forEach((row, idx) => {
    if (y > BOTTOM - 4) {
      doc.addPage();
      y = 20;
      y = drawHead(y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
    }
    if (idx % 2 === 1) {
      doc.setFillColor(...LIGHT);
      doc.rect(MARGIN, y - 5.5, CONTENT_W, 7.5, 'F');
    }
    doc.setTextColor(...DARK);
    let x = MARGIN + 2;
    row.forEach((cell, ci) => {
      const c = columns[ci];
      const maxChars = Math.max(6, Math.floor(c.width / 1.75));
      const text = cell.length > maxChars ? `${cell.slice(0, maxChars - 1)}…` : cell;
      if (c.align === 'right') doc.text(text, x + c.width - 2, y, { align: 'right' });
      else if (c.align === 'center') doc.text(text, x + c.width / 2 - 1, y, { align: 'center' });
      else doc.text(text, x, y);
      x += c.width;
    });
    y += 7.5;
  });
  return y + 4;
}

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

function money(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

function groupCount<T>(items: T[], key: (t: T) => string): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) map.set(key(item), (map.get(key(item)) || 0) + 1);
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function addReportContent(doc: jsPDF, id: ReportId, firstPage: boolean): void {
  let y = firstPage ? 40 : 20;
  const meta = REPORT_META[id];

  if (!firstPage) {
    header(doc, meta.category, meta.title);
    y = 40;
  }

  switch (id) {
    case 'employee-master': {
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
      break;
    }
    case 'headcount': {
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
      break;
    }
    case 'attendance': {
      const present = mockAttendance.filter((a) => a.status === 'Present').length;
      const avgHrs = mockAttendance.reduce((s, a) => s + a.workHours, 0) / Math.max(1, mockAttendance.length);
      y = titleBlock(doc, y, meta.title, 'Daily attendance with check-in, check-out, hours and overtime', `Generated ${todayLabel()} · ${mockAttendance.length} records · Date: 2024-01-08`);
      y = kpiStrip(doc, y, [
        { label: 'Records', value: String(mockAttendance.length) },
        { label: 'Present', value: String(present) },
        { label: 'Avg hours', value: avgHrs.toFixed(1) },
        { label: 'Overtime entries', value: String(mockAttendance.filter((a) => a.overtime > 0).length) },
      ]);
      y = sectionBar(doc, y, 'ATTENDANCE DETAIL — ALL RECORDS');
      y = drawTable(doc, y,
        [
          { label: 'Employee', width: 46, align: 'left' },
          { label: 'Date', width: 26, align: 'center' },
          { label: 'In', width: 18, align: 'center' },
          { label: 'Out', width: 18, align: 'center' },
          { label: 'Status', width: 28, align: 'center' },
          { label: 'Hrs', width: 18, align: 'right' },
          { label: 'OT', width: 28, align: 'right' },
        ],
        mockAttendance.map((a) => [a.employeeName, a.date, a.checkIn || '-', a.checkOut || '-', a.status, a.workHours.toFixed(1), a.overtime.toFixed(1)]),
      );
      break;
    }
    case 'late-early': {
      const flagged = mockAttendance.filter((a) => a.status === 'Late' || a.status === 'Half Day');
      y = titleBlock(doc, y, meta.title, 'Late arrivals and early / partial-day departures with full shift context', `Generated ${todayLabel()} · ${flagged.length} flagged of ${mockAttendance.length} records`);
      y = kpiStrip(doc, y, [
        { label: 'Flagged', value: String(flagged.length) },
        { label: 'Late', value: String(mockAttendance.filter((a) => a.status === 'Late').length) },
        { label: 'Half day', value: String(mockAttendance.filter((a) => a.status === 'Half Day').length) },
        { label: 'Flag rate', value: `${Math.round((flagged.length / Math.max(1, mockAttendance.length)) * 100)}%` },
      ]);
      y = sectionBar(doc, y, 'FLAGGED RECORDS — FULL DETAIL');
      y = drawTable(doc, y,
        [
          { label: 'Employee', width: 48, align: 'left' },
          { label: 'Date', width: 28, align: 'center' },
          { label: 'Check-in', width: 26, align: 'center' },
          { label: 'Check-out', width: 26, align: 'center' },
          { label: 'Status', width: 28, align: 'center' },
          { label: 'Hours', width: 26, align: 'right' },
        ],
        flagged.map((a) => [a.employeeName, a.date, a.checkIn || '-', a.checkOut || '-', a.status, a.workHours.toFixed(1)]),
      );
      break;
    }
    case 'leave-balance': {
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
      break;
    }
    case 'leave-utilization': {
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
      break;
    }
    case 'payroll-summary': {
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
      break;
    }
    case 'recruitment-pipeline': {
      const open = mockJobs.filter((j) => j.status === 'Open').length;
      const vacancies = mockJobs.reduce((s, j) => s + j.vacancies, 0);
      y = titleBlock(doc, y, meta.title, 'Open roles, vacancies and every candidate by stage with ratings', `Generated ${todayLabel()} · ${mockJobs.length} jobs · ${mockCandidates.length} candidates`);
      y = kpiStrip(doc, y, [
        { label: 'Open roles', value: String(open) },
        { label: 'Vacancies', value: String(vacancies) },
        { label: 'Candidates', value: String(mockCandidates.length) },
        { label: 'Selected', value: String(mockCandidates.filter((c) => c.stage === 'Selected').length) },
      ]);
      y = sectionBar(doc, y, 'OPEN ROLES — FULL DETAIL');
      y = drawTable(doc, y,
        [
          { label: 'Role', width: 56, align: 'left' },
          { label: 'Dept', width: 36, align: 'left' },
          { label: 'Vac.', width: 20, align: 'center' },
          { label: 'Applicants', width: 26, align: 'center' },
          { label: 'Status', width: 22, align: 'center' },
          { label: 'Closing', width: 22, align: 'center' },
        ],
        mockJobs.map((j) => [j.title, j.department, String(j.vacancies), String(j.applicants), j.status, j.closingDate]),
      );
      y = sectionBar(doc, y, 'CANDIDATES — FULL DETAIL');
      y = drawTable(doc, y,
        [
          { label: 'Candidate', width: 40, align: 'left' },
          { label: 'Role applied', width: 52, align: 'left' },
          { label: 'Stage', width: 30, align: 'center' },
          { label: 'Applied', width: 30, align: 'center' },
          { label: 'Rating', width: 30, align: 'center' },
        ],
        mockCandidates.map((c) => [c.name, c.jobTitle, c.stage, c.appliedDate, c.rating ? `${c.rating}/5` : '-']),
      );
      break;
    }
    case 'performance-reviews': {
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
      break;
    }
    case 'expense-claims': {
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
      break;
    }
    case 'audit-log': {
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
      break;
    }
  }

  y = ensureSpace(doc, y, 12);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text('This is a system-generated report from CodeQor HRMS and does not require a signature.', MARGIN, y);
}

/* ================= Public API ================= */

export function generateReportBlob(id: ReportId): Blob {
  const meta = REPORT_META[id];
  const doc = new jsPDF();
  header(doc, `${meta.category} · ${todayLabel()}`, meta.title);
  addReportContent(doc, id, true);
  footer(doc);
  return doc.output('blob');
}

export function reportFileName(id: ReportId): string {
  return `${REPORT_META[id].fileSlug}-${todayLabel()}.pdf`;
}

export function downloadReport(id: ReportId): void {
  downloadBlob(reportFileName(id), generateReportBlob(id));
}

/** One combined, professionally paginated pack with every report. */
export function downloadAllReportsPack(): void {
  const doc = new jsPDF();
  const ids = Object.keys(REPORT_META) as ReportId[];

  header(doc, `Complete pack · ${todayLabel()}`, 'HR Reports Pack');
  let y = 40;
  y = titleBlock(doc, y, 'HR Reports Pack', 'All modules — one professionally formatted PDF', `Generated ${todayLabel()} · ${ids.length} reports · CodeQor HRMS`);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...DARK);
  ids.forEach((id, i) => {
    y = ensureSpace(doc, y, 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text(`${i + 1}.  ${REPORT_META[id].title}`, MARGIN, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(REPORT_META[id].category, PAGE_W - MARGIN, y, { align: 'right' });
    y += 7;
  });

  ids.forEach((id) => {
    doc.addPage();
    const meta = REPORT_META[id];
    header(doc, `${meta.category} · ${todayLabel()}`, meta.title);
    addReportContent(doc, id, true);
  });

  // Brand teal accent on the cover header
  doc.setPage(1);
  doc.setFillColor(...TEAL);
  doc.rect(0, 30, PAGE_W, 1.6, 'F');

  footer(doc);
  downloadBlob(`hr-reports-pack-${todayLabel()}.pdf`, doc.output('blob'));
}
