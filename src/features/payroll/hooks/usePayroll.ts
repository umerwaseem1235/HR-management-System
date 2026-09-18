'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Payslip } from '@/types';
import { mockPayslips, mockEmployees, mockLeaveRequests, mockAttendance } from '@/lib/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import {
  PAYROLL_MONTHS, PAYROLL_YEARS, DAILY_RATE_DIVISOR,
  DEFAULT_COMPONENTS, createRun, recalcLine, calcRunTotals,
  runToPayslips, todayISO, seedDecember2023Run,
  getPayrollStatus, loadPayrollRuns, savePayrollRuns,
  DEFAULT_MONTHLY_PAID_LEAVES, resolveMonthlyLeaves,
} from '@/lib/payroll';
import type { PayrollRun, PayrollLineItem, SalaryComponent, EmployeeMonthlyLeaves, EmployeeMonthlyFines } from '@/lib/payroll';
import { payslipToPDF, runSummaryToPDF, downloadBlob } from '@/lib/payroll-pdf';

export type { PayrollRun, PayrollLineItem, SalaryComponent, EmployeeMonthlyLeaves, EmployeeMonthlyFines };

export interface CompModalState {
  id?: string;
  name: string;
  amount: string;
  kind: 'allowance' | 'deduction';
}

export function usePayroll() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('payslips');
  const isAdmin = user?.role !== 'employee';

  // ---- Core state: payslips (history), runs (history), salary structure ----
  const [payslips, setPayslips] = useState<Payslip[]>(mockPayslips);
  const [runs, setRuns] = useState<PayrollRun[]>(() => loadPayrollRuns(() => [seedDecember2023Run(mockPayslips)]));
  const [components, setComponents] = useState<SalaryComponent[]>(DEFAULT_COMPONENTS);
  // Monthly leaves: paid leave days per employee per month (fresh every month).
  // Company default + per-employee overrides; extra days auto-unpaid in payslip.
  const [monthlyDefault, setMonthlyDefault] = useState(DEFAULT_MONTHLY_PAID_LEAVES);
  const [empMonthly, setEmpMonthly] = useState<EmployeeMonthlyLeaves>({});
  const [empFines, setEmpFines] = useState<EmployeeMonthlyFines>({});
  const [fineDefault, setFineDefault] = useState(0);
  const [overrideEmpId, setOverrideEmpId] = useState('');

  // ---- Payslips tab: month filter + view ----
  const [payslipMonth, setPayslipMonth] = useState('all');
  const [payslipSearch, setPayslipSearch] = useState('');
  const [runSearch, setRunSearch] = useState('');
  const [runDetailSearch, setRunDetailSearch] = useState('');
  const [viewSlip, setViewSlip] = useState<Payslip | null>(null);

  // ---- Runs tab: new run form ----
  const [newMonth, setNewMonth] = useState('0');
  const [newYear, setNewYear] = useState(() => String(new Date().getFullYear()));
  const [runError, setRunError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ---- Runs tab: detail / review / finalize ----
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [editingLine, setEditingLine] = useState<PayrollLineItem | null>(null);
  const [showFinalize, setShowFinalize] = useState(false);
  const [confirmDeleteRun, setConfirmDeleteRun] = useState<PayrollRun | null>(null);
  const [busy, setBusy] = useState(false);

  // ---- Structures tab: add/edit component ----
  const [compModal, setCompModal] = useState<CompModalState | null>(null);

  const selectedRun = runs.find(r => r.id === selectedRunId) || null;

  const visiblePayslips = useMemo(() => {
    let list = payslips;
    if (!isAdmin && user) list = list.filter(p => p.employeeName === user.name);
    if (payslipMonth !== 'all') {
      const [y, m] = payslipMonth.split('-').map(Number);
      const monthName = PAYROLL_MONTHS[(m || 1) - 1];
      list = list.filter(p => p.month === monthName && p.year === y);
    }
    if (payslipSearch.trim()) list = list.filter(p => p.employeeName.toLowerCase().includes(payslipSearch.trim().toLowerCase()));
    return list;
  }, [payslips, payslipMonth, payslipSearch, isAdmin, user]);

  const visibleRuns = useMemo(() => {
    if (!runSearch.trim()) return runs;
    return runs.filter(r => `${r.month} ${r.year} ${r.id} ${r.status}`.toLowerCase().includes(runSearch.trim().toLowerCase()));
  }, [runs, runSearch]);

  const visibleRunItems = useMemo(() => {
    if (!selectedRun) return [];
    if (!runDetailSearch.trim()) return selectedRun.items;
    return selectedRun.items.filter(i => `${i.employeeName} ${i.department || ''}`.toLowerCase().includes(runDetailSearch.trim().toLowerCase()));
  }, [selectedRun, runDetailSearch]);

  const totalPayroll = mockEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
  // Status card follows the latest run: a new draft means payroll is
  // in process, locking it via Finalize & Lock marks it finalized.
  // Runs are persisted so the dashboard shows the same status.
  useEffect(() => {
    savePayrollRuns(runs);
  }, [runs]);
  const payrollStatus = getPayrollStatus(runs);

  // ================= Run actions =================
  const startNewRun = () => {
    const monthIndex = Number(newMonth);
    const year = Number(newYear);
    if (runs.some(r => r.monthIndex === monthIndex && r.year === year)) {
      setRunError(`A payroll run for ${PAYROLL_MONTHS[monthIndex]} ${year} already exists.`);
      return;
    }
    setRunError('');
    const run = createRun(monthIndex, year, mockEmployees, components, mockLeaveRequests, mockAttendance, todayISO(), monthlyDefault, empMonthly, empFines, fineDefault);
    setRuns(prev => [run, ...prev]);
    setSelectedRunId(run.id);
    setSuccessMsg(`Draft run created for ${run.month} ${run.year} — review each line, then finalize.`);
  };

  const updateRunItems = (runId: string, items: PayrollLineItem[]) => {
    const totals = calcRunTotals(items);
    setRuns(prev => prev.map(r => (r.id === runId ? { ...r, items, ...totals } : r)));
  };

  const saveEditedLine = (line: PayrollLineItem) => {
    if (!selectedRun) return;
    const recalculated = recalcLine(line);
    updateRunItems(selectedRun.id, selectedRun.items.map(i => (i.employeeId === recalculated.employeeId ? recalculated : i)));
    setEditingLine(null);
  };

  const markReviewed = (run: PayrollRun) => {
    setRuns(prev => prev.map(r => (r.id === run.id ? { ...r, status: 'Reviewed' as const } : r)));
  };

  const reopenToDraft = (run: PayrollRun) => {
    setRuns(prev => prev.map(r => (r.id === run.id ? { ...r, status: 'Draft' as const } : r)));
  };

  const finalizeRun = () => {
    if (!selectedRun) return;
    setBusy(true);
    const run = selectedRun;
    setTimeout(() => {
      const finalized: PayrollRun = {
        ...run,
        status: 'Finalized',
        finalizedOn: todayISO(),
        finalizedBy: user?.name || 'Admin',
      };
      setRuns(prev => prev.map(r => (r.id === run.id ? finalized : r)));
      setPayslips(prev => [...runToPayslips(finalized, todayISO()), ...prev]);
      setBusy(false);
      setShowFinalize(false);
      setSuccessMsg(`Payroll for ${run.month} ${run.year} finalized and locked — ${run.items.length} payslips generated.`);
    }, 600);
  };

  const deleteRun = (runId: string) => {
    setRuns(prev => prev.filter(r => r.id !== runId));
    if (selectedRunId === runId) setSelectedRunId(null);
    setConfirmDeleteRun(null);
  };

  const exportRun = (run: PayrollRun) => {
    downloadBlob(`payroll-summary-${run.id}.pdf`, runSummaryToPDF(run));
  };

  const downloadSlip = (slip: Payslip) => {
    downloadBlob(`payslip-${slip.employeeName.replace(/\s+/g, '-')}-${slip.month}-${slip.year}.pdf`, payslipToPDF(slip));
  };

  // ================= Structures actions =================
  const saveComponent = () => {
    if (!compModal) return;
    const name = compModal.name.trim();
    const amount = Math.max(0, Math.round(Number(compModal.amount) || 0));
    if (!name) return;
    if (compModal.id) {
      setComponents(prev => prev.map(c => (c.id === compModal.id ? { ...c, name, amount, kind: compModal.kind } : c)));
    } else {
      setComponents(prev => [...prev, { id: `c-${Date.now()}`, name, amount, kind: compModal.kind }]);
    }
    setCompModal(null);
  };

  const removeComponent = (id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
  };

  const tabs = isAdmin ? [
    { id: 'payslips', label: 'Payslips' },
    { id: 'runs', label: 'Payroll Runs' },
    { id: 'structures', label: 'Salary Structures' },
    { id: 'emp-rules', label: 'Monthly Leaves' },
  ] : [{ id: 'payslips', label: 'My Payslips' }];

  return {
    user, isAdmin, activeTab, setActiveTab, tabs,
    payslips, runs, components, setComponents, removeComponent,
    monthlyDefault, setMonthlyDefault, empMonthly, setEmpMonthly,
    empFines, setEmpFines, fineDefault, setFineDefault,
    overrideEmpId, setOverrideEmpId,
    payslipMonth, setPayslipMonth, payslipSearch, setPayslipSearch,
    runSearch, setRunSearch, runDetailSearch, setRunDetailSearch,
    viewSlip, setViewSlip,
    newMonth, setNewMonth, newYear, setNewYear, runError, successMsg, setSuccessMsg,
    selectedRunId, setSelectedRunId, selectedRun,
    editingLine, setEditingLine, showFinalize, setShowFinalize,
    confirmDeleteRun, setConfirmDeleteRun, busy,
    compModal, setCompModal,
    visiblePayslips, visibleRuns, visibleRunItems,
    totalPayroll, payrollStatus,
    startNewRun, saveEditedLine, markReviewed, reopenToDraft,
    finalizeRun, deleteRun, exportRun, downloadSlip, saveComponent,
    PAYROLL_MONTHS, PAYROLL_YEARS, DAILY_RATE_DIVISOR, resolveMonthlyLeaves,
  };
}

export type UsePayrollReturn = ReturnType<typeof usePayroll>;
