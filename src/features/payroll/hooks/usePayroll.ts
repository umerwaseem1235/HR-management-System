'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Employee, Payslip } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  PAYROLL_MONTHS, PAYROLL_YEARS, DAILY_RATE_DIVISOR,
  buildRunItems, recalcLine, calcRunTotals,
  getPayrollStatus, resolveMonthlyLeaves,
} from '@/lib/payroll';
import type { PayrollRun, PayrollLineItem, SalaryComponent, EmployeeMonthlyLeaves, EmployeeMonthlyFines } from '@/lib/payroll';
// NOTE: jspdf (~350KB) is intentionally NOT imported here. PDF helpers are
// dynamically imported inside exportRun/downloadSlip so the heavy library
// loads only when the user actually exports — never on page render.
import { getLeaveRequests } from '@/lib/actions/leave';
import { getAllAttendance } from '@/lib/actions/attendance';
import {
  getPayrollData,
  getPayrollRuns, getPayrollRun, getPayslips, getSalaryComponents,
  createPayrollRun, createSalaryComponent, updateSalaryComponent, deleteSalaryComponent,
  updatePayrollRunStatus, updatePayrollItem, updatePayrollRunTotals,
  finalizePayrollRun, unlockPayrollRun, deletePayrollRun,
} from '@/lib/actions/payroll';
import { createResourceCache } from '@/lib/resource-cache';

// Professional auto-dismiss timings for transient banners.
const SUCCESS_DISMISS_MS = 5000;
const ERROR_DISMISS_MS = 6000;

// Unique key generators for toasts to avoid empty-string key collisions.
let successKey = 0;
let errorKey = 0;
function nextSuccessKey() { return ++successKey; }
function nextErrorKey() { return ++errorKey; }

export type { PayrollRun, PayrollLineItem, SalaryComponent, EmployeeMonthlyLeaves, EmployeeMonthlyFines };

/** Everything the payroll page renders from its initial parallel load. */
interface PayrollSnapshot {
  employees: Employee[];
  runs: PayrollRun[];
  payslips: Payslip[];
  components: SalaryComponent[];
}

// Module scope survives navigation, so returning to /payroll paints instantly
// instead of re-running the loader. Warmed on idle from the dashboard layout
// (see warmPayrollCache) so even the first visit is usually instant.
const payrollCache = createResourceCache<PayrollSnapshot>('payroll:data', 60_000);

/** Idle-warmer: fills the cache without touching React state. */
export function warmPayrollCache(): void {
  try {
    if (payrollCache.peek()) return;
    void payrollCache.load(getPayrollData).catch(() => {});
  } catch {
    // Never let a prefetch break the page.
  }
}

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
  const isSuperAdmin = user?.role === 'super_admin';

  // ---- Core state (all from Supabase) ----
  // Lazy-init from the module cache so a warm revisit paints on the very
  // first render instead of flashing a loader before the effect runs.
  const [employees, setEmployees] = useState<Employee[]>(() => payrollCache.get()?.employees ?? []);
  const [payslips, setPayslips] = useState<Payslip[]>(() => payrollCache.get()?.payslips ?? []);
  const [runs, setRuns] = useState<PayrollRun[]>(() => payrollCache.get()?.runs ?? []);
  const [components, setComponents] = useState<SalaryComponent[]>(() => payrollCache.get()?.components ?? []);
  const [isLoading, setIsLoading] = useState(() => payrollCache.get() === null);
  const [loadError, setLoadError] = useState('');
  // Becomes true once real (or cached) data has been applied; gates the cache
  // write-back so empty initial state never overwrites the snapshot.
  const [ready, setReady] = useState(false);
  // Monthly leaves: paid leave days per employee per month (fresh every month).
  // Company default + per-employee overrides; extra days auto-unpaid in payslip.
  const [monthlyDefault, setMonthlyDefault] = useState(2);
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
  const [runErrorKey, setRunErrorKey] = useState(0);
  const [successMsg, setSuccessMsg] = useState('');
  const [successMsgKey, setSuccessMsgKey] = useState(0);

  // ---- Runs tab: detail / review / finalize ----
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);
  const [editingLine, setEditingLine] = useState<PayrollLineItem | null>(null);
  const [showFinalize, setShowFinalize] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [confirmDeleteRun, setConfirmDeleteRun] = useState<PayrollRun | null>(null);
  const [busy, setBusy] = useState(false);

  // ---- Structures tab: add/edit component ----
  const [compModal, setCompModal] = useState<CompModalState | null>(null);

  const refreshRuns = async () => setRuns(await getPayrollRuns());
  const refreshPayslips = async () => setPayslips(await getPayslips());
  const refreshComponents = async () => setComponents(await getSalaryComponents());

  const refreshSelectedRun = async (id: string) => {
    const full = await getPayrollRun(id);
    setSelectedRun(full);
    setRuns((prev) => prev.map((r) => (r.id === id ? full : r)));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snapshot = payrollCache.peek();
      if (snapshot) {
        if (!cancelled) {
          setEmployees(snapshot.data.employees);
          setRuns(snapshot.data.runs);
          setPayslips(snapshot.data.payslips);
          setComponents(snapshot.data.components);
          setReady(true);
          setIsLoading(false);
        }
        if (!snapshot.isStale) return;
      } else if (!cancelled) {
        setIsLoading(true);
      }
      setLoadError('');
      try {
        // ONE client→server round trip (the action fans out concurrently
        // server-side). Previously four separate actions per visit.
        const snap = await payrollCache.load(getPayrollData, { force: true });
        if (cancelled) return;
        setEmployees(snap.employees);
        setRuns(snap.runs);
        setPayslips(snap.payslips);
        setComponents(snap.components);
        setReady(true);
      } catch (err) {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Failed to load payroll data');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Keep the cached snapshot in sync with local mutations (run actions, line
  // edits, structure changes) so the next mount is current.
  useEffect(() => {
    if (!ready) return;
    payrollCache.set({ employees, runs, payslips, components });
  }, [ready, employees, runs, payslips, components]);

  // Transient banners dismiss themselves professionally: each new message
  // restarts its timer, manual dismissal still works, and timers never leak.
  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => {
      setSuccessMsg('');
      setSuccessMsgKey(0);
    }, SUCCESS_DISMISS_MS);
    return () => clearTimeout(t);
  }, [successMsg]);

  useEffect(() => {
    if (!runError) return;
    const t = setTimeout(() => {
      setRunError('');
      setRunErrorKey(0);
    }, ERROR_DISMISS_MS);
    return () => clearTimeout(t);
  }, [runError]);

  // A confirmation dialog must never survive a context switch: confirming
  // after navigating to another run/tab would lock/unlock the wrong run.
  const closeStaleDialogs = () => {
    setShowFinalize(false);
    setShowUnlock(false);
    setEditingLine(null);
  };

  const handleTabChange = (tab: string) => {
    closeStaleDialogs();
    setActiveTab(tab);
  };

  useEffect(() => {
    closeStaleDialogs();
    if (!selectedRunId) {
      setSelectedRun(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const full = await getPayrollRun(selectedRunId);
        if (!cancelled) {
          setSelectedRun(full);
          setRuns((prev) => prev.map((r) => (r.id === full.id ? full : r)));
        }
      } catch (err) {
        if (!cancelled) setRunError(err instanceof Error ? err.message : 'Failed to load run');
      }
    })();
    return () => { cancelled = true; };
  }, [selectedRunId]);

  const currentEmployee = useMemo(() => {
    if (!user) return undefined;
    return (
      employees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
      employees.find((e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase())
    );
  }, [user, employees]);

  const visiblePayslips = useMemo(() => {
    let list = payslips;
    if (!isAdmin && currentEmployee) list = list.filter((p) => p.employeeId === currentEmployee.id);
    else if (!isAdmin && user) list = list.filter((p) => p.employeeName === user.name);
    if (payslipMonth !== 'all') {
      const [y, m] = payslipMonth.split('-').map(Number);
      const monthName = PAYROLL_MONTHS[(m || 1) - 1];
      list = list.filter((p) => p.month === monthName && p.year === y);
    }
    if (payslipSearch.trim()) list = list.filter((p) => p.employeeName.toLowerCase().includes(payslipSearch.trim().toLowerCase()));
    return list;
  }, [payslips, payslipMonth, payslipSearch, isAdmin, currentEmployee, user]);

  const visibleRuns = useMemo(() => {
    if (!runSearch.trim()) return runs;
    return runs.filter((r) => `${r.month} ${r.year} ${r.id} ${r.status}`.toLowerCase().includes(runSearch.trim().toLowerCase()));
  }, [runs, runSearch]);

  const visibleRunItems = useMemo(() => {
    if (!selectedRun) return [];
    if (!runDetailSearch.trim()) return selectedRun.items;
    return selectedRun.items.filter((i) => `${i.employeeName} ${i.department || ''}`.toLowerCase().includes(runDetailSearch.trim().toLowerCase()));
  }, [selectedRun, runDetailSearch]);

  const totalPayroll = employees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
  // Status card follows the latest run: a new draft means payroll is
  // in process, locking it via Finalize & Lock marks it finalized.
  const payrollStatus = getPayrollStatus(runs);

  // ================= Run actions =================
  const startNewRun = async () => {
    const monthIndex = Number(newMonth);
    const year = Number(newYear);
    if (runs.some((r) => r.monthIndex === monthIndex && r.year === year)) {
      setRunError(`A payroll run for ${PAYROLL_MONTHS[monthIndex]} ${year} already exists.`);
      setRunErrorKey(nextErrorKey());
      return;
    }
    setRunError('');
    setRunErrorKey(0);
    setBusy(true);
    try {
      const [leaves, attendance] = await Promise.all([
        getLeaveRequests(),
        getAllAttendance(year, monthIndex + 1),
      ]);
      const items = buildRunItems(employees, components, leaves, attendance, monthIndex, year, monthlyDefault, empMonthly, empFines, fineDefault);
      await createPayrollRun(monthIndex, year, items);
      await refreshRuns();
      setSelectedRunId(`PR-${year}-${String(monthIndex + 1).padStart(2, '0')}`);
      setSuccessMsg(`Draft run created for ${PAYROLL_MONTHS[monthIndex]} ${year} — review each line, then finalize.`);
      setSuccessMsgKey(nextSuccessKey());
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Failed to create payroll run');
      setRunErrorKey(nextErrorKey());
    } finally {
      setBusy(false);
    }
  };

  const updateRunItems = (runId: string, items: PayrollLineItem[]) => {
    const totals = calcRunTotals(items);
    setRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, items, ...totals } : r)));
    setSelectedRun((prev) => (prev && prev.id === runId ? { ...prev, items, ...totals } : prev));
  };

  const saveEditedLine = async (line: PayrollLineItem) => {
    if (!selectedRun) return;
    const recalculated = recalcLine(line);
    setBusy(true);
    try {
      if (recalculated.id) {
        await updatePayrollItem(recalculated.id, {
          basic_salary: recalculated.basicSalary,
          allowances: recalculated.allowances,
          deductions: recalculated.deductions,
          paid_leave_days: recalculated.paidLeaveDays,
          unpaid_leave_days: recalculated.unpaidLeaveDays,
          absent_days: recalculated.absentDays,
          leave_deduction: recalculated.leaveDeduction,
          gross_salary: recalculated.grossSalary,
          total_allowances: recalculated.totalAllowances,
          total_deductions: recalculated.totalDeductions,
          net_salary: recalculated.netSalary,
        });
      }
      const items = selectedRun.items.map((i) =>
        (recalculated.id ? i.id === recalculated.id : i.employeeId === recalculated.employeeId) ? recalculated : i,
      );
      const totals = calcRunTotals(items);
      await updatePayrollRunTotals(selectedRun.id, totals);
      updateRunItems(selectedRun.id, items);
      setEditingLine(null);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Failed to save line');
      setRunErrorKey(nextErrorKey());
    } finally {
      setBusy(false);
    }
  };

  const markReviewed = async (run: PayrollRun) => {
    setRunError('');
    setRunErrorKey(0);
    setBusy(true);
    try {
      await updatePayrollRunStatus(run.id, 'Reviewed');
      await refreshSelectedRun(run.id);
      setSuccessMsg(`Payroll for ${run.month} ${run.year} marked as Reviewed — ready to finalize.`);
      setSuccessMsgKey(nextSuccessKey());
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Failed to mark run as reviewed');
      setRunErrorKey(nextErrorKey());
    } finally {
      setBusy(false);
    }
  };

  const reopenToDraft = async (run: PayrollRun) => {
    setRunError('');
    setRunErrorKey(0);
    setBusy(true);
    try {
      await updatePayrollRunStatus(run.id, 'Draft');
      await refreshSelectedRun(run.id);
      setSuccessMsg(`Payroll for ${run.month} ${run.year} reopened to Draft.`);
      setSuccessMsgKey(nextSuccessKey());
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Failed to reopen run');
      setRunErrorKey(nextErrorKey());
    } finally {
      setBusy(false);
    }
  };

  const unlockRun = async () => {
    if (!selectedRun) return;
    // Defense in depth: the server re-verifies, but never even send the
    // request unless the signed-in user is a Super Admin.
    setShowUnlock(false);
    if (!isSuperAdmin) {
      setRunError('Only a Super Admin can unlock a finalized payroll run.');
      setRunErrorKey(nextErrorKey());
      return;
    }
    if (selectedRun.status !== 'Finalized') {
      setRunError(`Only a Finalized run can be unlocked (current status: ${selectedRun.status}).`);
      setRunErrorKey(nextErrorKey());
      return;
    }
    setBusy(true);
    try {
      await unlockPayrollRun(selectedRun.id);
      await refreshSelectedRun(selectedRun.id);
      setSuccessMsg(`Payroll for ${selectedRun.month} ${selectedRun.year} unlocked — moved back to Reviewed.`);
      setSuccessMsgKey(nextSuccessKey());
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Failed to unlock run');
      setRunErrorKey(nextErrorKey());
    } finally {
      setBusy(false);
    }
  };

  const finalizeRun = async () => {
    if (!selectedRun) return;
    // Client-side mirror of the server guard: never finalize from any
    // status other than Reviewed, and always close the dialog first so a
    // stale confirmation can never fire for another run.
    setShowFinalize(false);
    if (selectedRun.status !== 'Reviewed') {
      setRunError(`Only a Reviewed run can be finalized (current status: ${selectedRun.status}).`);
      setRunErrorKey(nextErrorKey());
      return;
    }
    setBusy(true);
    try {
      await finalizePayrollRun(selectedRun.id, user?.name || 'Admin');
      await refreshSelectedRun(selectedRun.id);
      await refreshPayslips();
      setSuccessMsg(`Payroll for ${selectedRun.month} ${selectedRun.year} finalized and locked — ${selectedRun.items.length} payslips generated.`);
      setSuccessMsgKey(nextSuccessKey());
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Failed to finalize run');
      setRunErrorKey(nextErrorKey());
    } finally {
      setBusy(false);
    }
  };

  const deleteRun = async (runId: string) => {
    setRunError('');
    setRunErrorKey(0);
    setBusy(true);
    try {
      await deletePayrollRun(runId);
      await refreshRuns();
      if (selectedRunId === runId) {
        setSelectedRunId(null);
        setSelectedRun(null);
      }
      setConfirmDeleteRun(null);
      setSuccessMsg('Payroll run deleted.');
      setSuccessMsgKey(nextSuccessKey());
    } catch (err) {
      setRunError(err instanceof Error ? err.message : 'Failed to delete run');
      setRunErrorKey(nextErrorKey());
      setConfirmDeleteRun(null);
    } finally {
      setBusy(false);
    }
  };

  const exportRun = async (run: PayrollRun) => {
    const { runSummaryToPDF, downloadBlob } = await import('@/lib/payroll-pdf');
    downloadBlob(`payroll-summary-${run.id}.pdf`, runSummaryToPDF(run));
  };

  const downloadSlip = async (slip: Payslip) => {
    const { payslipToPDF, downloadBlob } = await import('@/lib/payroll-pdf');
    downloadBlob(`payslip-${slip.employeeName.replace(/\s+/g, '-')}-${slip.month}-${slip.year}.pdf`, payslipToPDF(slip));
  };

  // ================= Structures actions =================
  const saveComponent = async () => {
    if (!compModal) return;
    const name = compModal.name.trim();
    const amount = Math.max(0, Math.round(Number(compModal.amount) || 0));
    if (!name) return;
    if (compModal.id) {
      await updateSalaryComponent(compModal.id, { name, amount, kind: compModal.kind });
    } else {
      await createSalaryComponent({ name, amount, kind: compModal.kind });
    }
    await refreshComponents();
    setCompModal(null);
  };

  const removeComponent = async (id: string) => {
    await deleteSalaryComponent(id);
    await refreshComponents();
  };

  const tabs = isAdmin ? [
    { id: 'payslips', label: 'Payslips' },
    { id: 'runs', label: 'Payroll Runs' },
    { id: 'emp-rules', label: 'Monthly Leaves' },
  ] : [{ id: 'payslips', label: 'My Payslips' }];

  return {
    user, isAdmin, isSuperAdmin, activeTab, setActiveTab: handleTabChange, tabs,
    employees, payslips, runs, components, setComponents, removeComponent,
    monthlyDefault, setMonthlyDefault, empMonthly, setEmpMonthly,
    empFines, setEmpFines, fineDefault, setFineDefault,
    overrideEmpId, setOverrideEmpId,
    payslipMonth, setPayslipMonth, payslipSearch, setPayslipSearch,
    runSearch, setRunSearch, runDetailSearch, setRunDetailSearch,
    viewSlip, setViewSlip,
    newMonth, setNewMonth, newYear, setNewYear, runError, setRunError, runErrorKey, setRunErrorKey, successMsg, setSuccessMsg, successMsgKey, setSuccessMsgKey,
    selectedRunId, setSelectedRunId, selectedRun,
    editingLine, setEditingLine, showFinalize, setShowFinalize,
    showUnlock, setShowUnlock,
    confirmDeleteRun, setConfirmDeleteRun, busy,
    compModal, setCompModal,
    visiblePayslips, visibleRuns, visibleRunItems,
    totalPayroll, payrollStatus,
    isLoading, loadError,
    startNewRun, saveEditedLine, markReviewed, reopenToDraft,
    finalizeRun, unlockRun, deleteRun, exportRun, downloadSlip, saveComponent,
    PAYROLL_MONTHS, PAYROLL_YEARS, DAILY_RATE_DIVISOR, resolveMonthlyLeaves,
  };
}

export type UsePayrollReturn = ReturnType<typeof usePayroll>;
