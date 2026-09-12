import type { AttendanceRecord, Employee, LeaveRequest, Payslip } from './types';

export const PAYROLL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const PAYROLL_YEARS = [2023, 2024, 2025, 2026];

/** Daily rate divisor (30-day month convention, shown in the UI). */
export const DAILY_RATE_DIVISOR = 30;

const UNPAID_LEAVE_TYPE = 'Unpaid Leave';

export interface SalaryComponent {
  id: string;
  name: string;
  amount: number;
  kind: 'allowance' | 'deduction';
}

export interface PayrollLineItem {
  employeeId: string;
  employeeName: string;
  department: string;
  basicSalary: number;
  allowances: { name: string; amount: number }[];
  deductions: { name: string; amount: number }[];
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  absentDays: number;
  leaveDeduction: number;
  grossSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
}

export type PayrollRunStatus = 'Draft' | 'Reviewed' | 'Finalized';

export interface PayrollRun {
  id: string;
  month: string;
  monthIndex: number;
  year: number;
  status: PayrollRunStatus;
  items: PayrollLineItem[];
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  createdOn: string;
  finalizedOn?: string;
  finalizedBy?: string;
}

/** Company-wide default monthly salary components (editable in Salary Structures). */
export const DEFAULT_COMPONENTS: SalaryComponent[] = [
  { id: 'a1', name: 'Housing', amount: 1500, kind: 'allowance' },
  { id: 'a2', name: 'Transport', amount: 500, kind: 'allowance' },
  { id: 'a3', name: 'Meal', amount: 300, kind: 'allowance' },
  { id: 'd1', name: 'Tax', amount: 1580, kind: 'deduction' },
  { id: 'd2', name: 'Health Insurance', amount: 250, kind: 'deduction' },
  { id: 'd3', name: 'Retirement Fund', amount: 475, kind: 'deduction' },
];

function parseDate(dateStr: string): { y: number; m: number; d: number } {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { y, m: m - 1, d };
}

/** Counts days of [startDate, endDate] that fall inside the target month/year. */
export function daysInMonth(startDate: string, endDate: string, monthIndex: number, year: number): number {
  const s = parseDate(startDate);
  const e = parseDate(endDate);
  let count = 0;
  const cursor = Date.UTC(s.y, s.m, s.d);
  const end = Date.UTC(e.y, e.m, e.d);
  for (let t = cursor; t <= end; t += 86400000) {
    const dt = new Date(t);
    if (dt.getUTCFullYear() === year && dt.getUTCMonth() === monthIndex) count++;
  }
  return count;
}

export function isInMonth(dateStr: string, monthIndex: number, year: number): boolean {
  const p = parseDate(dateStr);
  return p.y === year && p.m === monthIndex;
}

/** Monthly paid leaves — the whole leave calculation is monthly.
 *  Each employee gets this many paid leave days per calendar month
 *  (fresh every month, no carryover). Approved days within it are fully paid;
 *  anything beyond it is automatically unpaid and flows into the payslip
 *  deduction. 'Unpaid Leave' requests are always fully unpaid. */
export const DEFAULT_MONTHLY_PAID_LEAVES = 2;

/** Per-employee monthly manual fines (flat amount added to payslip deduction). */
export type EmployeeMonthlyFines = Record<string, number>;

/** Per-employee monthly paid leave overrides (days per month). */
export type EmployeeMonthlyLeaves = Record<string, number>;

/** Effective monthly paid leaves for one employee (override wins, else company default). */
export function resolveMonthlyLeaves(
  employeeId: string,
  companyDefault: number,
  employeeMonthly: EmployeeMonthlyLeaves = {},
): number {
  const over = employeeMonthly[employeeId];
  return Math.max(0, over ?? companyDefault);
}

/** Approved leave impact for one employee in a month — MONTHLY basis.
 *  Only days falling inside the target month count (cross-month requests split
 *  automatically). Returns paid/unpaid day counts for the payslip. */
export function leaveImpact(
  employeeId: string,
  monthIndex: number,
  year: number,
  leaves: LeaveRequest[],
  monthlyAllowance: number = DEFAULT_MONTHLY_PAID_LEAVES,
): { paidDays: number; unpaidDays: number } {
  let inMonth = 0;
  let unpaidType = 0;
  for (const leave of leaves) {
    if (leave.employeeId !== employeeId || leave.status !== 'Approved') continue;
    const days = daysInMonth(leave.startDate, leave.endDate, monthIndex, year);
    if (days <= 0) continue;
    if (leave.leaveType === UNPAID_LEAVE_TYPE) unpaidType += days;
    else inMonth += days;
  }
  const paidDays = Math.min(inMonth, Math.max(0, monthlyAllowance));
  const unpaidDays = inMonth - paidDays + unpaidType;
  const round2 = (n: number) => Math.round(n * 100) / 100;
  return { paidDays: round2(paidDays), unpaidDays: round2(unpaidDays) };
}

/** Attendance impact for one employee in a month (absences count as unpaid). */
export function attendanceImpact(
  employeeId: string,
  monthIndex: number,
  year: number,
  records: AttendanceRecord[],
): { absentDays: number } {
  let absentDays = 0;
  for (const rec of records) {
    if (rec.employeeId !== employeeId || !isInMonth(rec.date, monthIndex, year)) continue;
    if (rec.status === 'Absent') absentDays += 1;
    else if (rec.status === 'Half Day') absentDays += 0.5;
  }
  return { absentDays };
}

export function sumAmounts(list: { amount: number }[]): number {
  return list.reduce((s, x) => s + (Number(x.amount) || 0), 0);
}

/** Recomputes gross / totals / net for a single line item. */
export function recalcLine(line: PayrollLineItem): PayrollLineItem {
  const totalAllowances = Math.round(sumAmounts(line.allowances));
  const baseDeductions = Math.round(sumAmounts(line.deductions));
  const leaveDeduction = Math.round(line.leaveDeduction);
  const grossSalary = Math.round(line.basicSalary + totalAllowances);
  const totalDeductions = Math.round(baseDeductions + leaveDeduction);
  return {
    ...line,
    totalAllowances,
    totalDeductions,
    leaveDeduction,
    grossSalary,
    netSalary: Math.round(grossSalary - totalDeductions),
  };
}

/** Builds draft line items for every employee for a month. */
export function buildRunItems(
  employees: Employee[],
  components: SalaryComponent[],
  leaves: LeaveRequest[],
  attendance: AttendanceRecord[],
  monthIndex: number,
  year: number,
  monthlyDefault: number = DEFAULT_MONTHLY_PAID_LEAVES,
  employeeMonthly: EmployeeMonthlyLeaves = {},
  employeeFines: EmployeeMonthlyFines = {},
  fineDefault: number = 0,
): PayrollLineItem[] {
  const allowances = components.filter(c => c.kind === 'allowance');
  const deductions = components.filter(c => c.kind === 'deduction');

  return employees.map(emp => {
    const basicSalary = Math.round((emp.salary || 0) / 12);
    const { paidDays, unpaidDays } = leaveImpact(emp.id, monthIndex, year, leaves, resolveMonthlyLeaves(emp.id, monthlyDefault, employeeMonthly));
    const { absentDays } = attendanceImpact(emp.id, monthIndex, year, attendance);
    const unpaidTotal = unpaidDays + absentDays;
    const leaveDeduction = Math.round((basicSalary / DAILY_RATE_DIVISOR) * unpaidTotal);

    return recalcLine({
      employeeId: emp.id,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      basicSalary,
      allowances: allowances.map(a => ({ name: a.name, amount: a.amount })),
      deductions: deductions.map(d => ({ name: d.name, amount: d.amount })),
      paidLeaveDays: paidDays,
      unpaidLeaveDays: unpaidDays,
      absentDays,
      leaveDeduction: leaveDeduction + (employeeFines[emp.id] ?? fineDefault),
      grossSalary: 0,
      totalAllowances: 0,
      totalDeductions: 0,
      netSalary: 0,
    });
  });
}

export function calcRunTotals(items: PayrollLineItem[]): { totalGross: number; totalDeductions: number; totalNet: number } {
  return {
    totalGross: items.reduce((s, i) => s + i.grossSalary, 0),
    totalDeductions: items.reduce((s, i) => s + i.totalDeductions, 0),
    totalNet: items.reduce((s, i) => s + i.netSalary, 0),
  };
}

export function createRun(
  monthIndex: number,
  year: number,
  employees: Employee[],
  components: SalaryComponent[],
  leaves: LeaveRequest[],
  attendance: AttendanceRecord[],
  createdOn: string,
  monthlyDefault: number = DEFAULT_MONTHLY_PAID_LEAVES,
  employeeMonthly: EmployeeMonthlyLeaves = {},
  employeeFines: EmployeeMonthlyFines = {},
  fineDefault: number = 0,
): PayrollRun {
  const items = buildRunItems(employees, components, leaves, attendance, monthIndex, year, monthlyDefault, employeeMonthly, employeeFines, fineDefault);
  const totals = calcRunTotals(items);
  return {
    id: `PR-${year}-${String(monthIndex + 1).padStart(2, '0')}`,
    month: PAYROLL_MONTHS[monthIndex],
    monthIndex,
    year,
    status: 'Draft',
    items,
    ...totals,
    createdOn,
  };
}

/** Converts a finalized run into payslips (payroll history entries). */
export function runToPayslips(run: PayrollRun, generatedOn: string): Payslip[] {
  return run.items.map((item, idx) => ({
    id: `gen-${run.id}-${idx + 1}`,
    employeeId: item.employeeId,
    employeeName: item.employeeName,
    month: run.month,
    year: run.year,
    basicSalary: item.basicSalary,
    allowances: item.allowances,
    deductions: [
      ...item.deductions,
      ...(item.leaveDeduction > 0 ? [{ name: 'Unpaid Leave / Absence', amount: item.leaveDeduction }] : []),
    ],
    grossSalary: item.grossSalary,
    netSalary: item.netSalary,
    status: 'Finalized' as const,
    generatedOn,
  }));
}

/* PDF generation lives in payroll-pdf.ts (keeps this engine lightweight for all pages). */

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Seed history: December 2023 run matching the existing mock payslips. */
export function seedDecember2023Run(payslips: Payslip[]): PayrollRun {
  const items: PayrollLineItem[] = payslips
    .filter(p => p.month === 'December' && p.year === 2023)
    .map(p =>
      recalcLine({
        employeeId: p.employeeId,
        employeeName: p.employeeName,
        department: '',
        basicSalary: p.basicSalary,
        allowances: p.allowances,
        deductions: p.deductions,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        absentDays: 0,
        leaveDeduction: 0,
        grossSalary: 0,
        totalAllowances: 0,
        totalDeductions: 0,
        netSalary: 0,
      }),
    );
  const totals = calcRunTotals(items);
  return {
    id: 'PR-2023-12',
    month: 'December',
    monthIndex: 11,
    year: 2023,
    status: 'Finalized',
    items,
    ...totals,
    createdOn: '2023-12-28',
    finalizedOn: '2024-01-01',
    finalizedBy: 'Sarah Williams',
  };
}
