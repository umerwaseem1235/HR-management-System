'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import {
  DollarSign, FileText, Calculator, Download, Eye, Plus, Pencil,
  Trash2, Lock, ArrowLeft, CheckCircle2, AlertTriangle, CalendarDays,
} from 'lucide-react';
import type { Payslip } from '../../lib/types';
import { mockPayslips, mockEmployees, mockLeaveRequests, mockAttendance } from '../../lib/mock-data';
import { useAuth } from '../../contexts/AuthContext';
import {
  PAYROLL_MONTHS, PAYROLL_YEARS, DAILY_RATE_DIVISOR,
  DEFAULT_COMPONENTS, createRun, recalcLine, calcRunTotals,
  runToPayslips, todayISO, seedDecember2023Run,
  DEFAULT_MONTHLY_PAID_LEAVES, resolveMonthlyLeaves,
} from '../../lib/payroll';
import type { PayrollRun, PayrollLineItem, SalaryComponent, EmployeeMonthlyLeaves, EmployeeMonthlyFines } from '../../lib/payroll';
import { payslipToPDF, runSummaryToPDF, downloadBlob } from '../../lib/payroll-pdf';

const money = (n: number) => `$${Math.round(n).toLocaleString()}`;

function runStatusBadge(status: PayrollRun['status']) {
  if (status === 'Finalized') return <Badge variant="success"><span className="inline-flex items-center gap-1"><Lock size={12} /> Finalized</span></Badge>;
  if (status === 'Reviewed') return <Badge variant="info">Reviewed</Badge>;
  return <Badge variant="warning">Draft</Badge>;
}

export default function PayrollPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('payslips');
  const isAdmin = user?.role !== 'employee';

  // ---- Core state: payslips (history), runs (history), salary structure ----
  const [payslips, setPayslips] = useState<Payslip[]>(mockPayslips);
  const [runs, setRuns] = useState<PayrollRun[]>(() => [seedDecember2023Run(mockPayslips)]);
  const [components, setComponents] = useState<SalaryComponent[]>(DEFAULT_COMPONENTS);
  // Monthly leaves: paid leave days per employee per month (fresh every month).
  // Company default + per-employee overrides; extra days auto-unpaid in payslip.
  const [monthlyDefault, setMonthlyDefault] = useState(DEFAULT_MONTHLY_PAID_LEAVES);
  const [empMonthly, setEmpMonthly] = useState<EmployeeMonthlyLeaves>({});
  const [empFines, setEmpFines] = useState<EmployeeMonthlyFines>({});
  const [fineDefault, setFineDefault] = useState(0);
  const [overrideEmpId, setOverrideEmpId] = useState('');

  // ---- Payslips tab: month filter + view ----
  const [payslipFilter, setPayslipFilter] = useState('all');
  const [viewSlip, setViewSlip] = useState<Payslip | null>(null);

  // ---- Runs tab: new run form ----
  const [newMonth, setNewMonth] = useState('0');
  const [newYear, setNewYear] = useState('2024');
  const [runError, setRunError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ---- Runs tab: detail / review / finalize ----
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [editingLine, setEditingLine] = useState<PayrollLineItem | null>(null);
  const [showFinalize, setShowFinalize] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // ---- Structures tab: add/edit component ----
  const [compModal, setCompModal] = useState<{ id?: string; name: string; amount: string; kind: 'allowance' | 'deduction' } | null>(null);

  const selectedRun = runs.find(r => r.id === selectedRunId) || null;

  const visiblePayslips = useMemo(() => {
    let list = payslips;
    if (!isAdmin && user) list = list.filter(p => p.employeeName === user.name);
    if (payslipFilter !== 'all') {
      const [m, y] = payslipFilter.split('|');
      list = list.filter(p => p.month === m && String(p.year) === y);
    }
    return list;
  }, [payslips, payslipFilter, isAdmin, user]);

  const monthFilterOptions = useMemo(() => {
    const seen = new Map<string, { m: string; y: number }>();
    for (const p of payslips) {
      const key = `${p.month}|${p.year}`;
      if (!seen.has(key)) seen.set(key, { m: p.month, y: p.year });
    }
    return [
      { value: 'all', label: 'All Months' },
      ...[...seen.entries()].map(([key, v]) => ({ value: key, label: `${v.m} ${v.y}` })),
    ];
  }, [payslips]);

  const totalPayroll = mockEmployees.reduce((sum, emp) => sum + (emp.salary || 0), 0);
  const payrollStatus = runs.some(r => r.status === 'Finalized') ? 'Finalized' : 'Pending';

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
    setConfirmDeleteId(null);
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

  const tabs = isAdmin ? [
    { id: 'payslips', label: 'Payslips' },
    { id: 'runs', label: 'Payroll Runs' },
    { id: 'structures', label: 'Salary Structures' },
    { id: 'emp-rules', label: 'Monthly Leaves' },
  ] : [{ id: 'payslips', label: 'My Payslips' }];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Compensation"
          title="Payroll"
          subtitle="Payslips, payroll runs and salary structures"
          actions={isAdmin && (
            <Button variant="primary" onClick={() => setActiveTab('runs')}>
              <Calculator size={16} /> Process Payroll
            </Button>
          )}
        />

        {successMsg && (
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
            <p className="flex-1">{successMsg}</p>
            <button onClick={() => setSuccessMsg('')} className="font-semibold hover:underline">Dismiss</button>
          </div>
        )}

        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Monthly Payroll" value={money(totalPayroll / 12)} icon={<DollarSign size={22} className="text-green-600" />} iconBg="bg-green-50" />
            <StatCard title="Total Employees" value={mockEmployees.length} icon={<FileText size={22} className="text-[#0F8B8D]" />} iconBg="bg-[#EAF2F4]" />
            <StatCard title="Payroll Status" value={payrollStatus} icon={<Calculator size={22} className="text-purple-600" />} iconBg="bg-purple-50" />
          </div>
        )}

        <Card padding="none">
          <div className="px-6 pt-4"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
          <div className="p-6">

            {/* ==================== PAYSLIPS ==================== */}
            {activeTab === 'payslips' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#17324D]">
                    <CalendarDays size={16} className="text-[#0F8B8D]" /> Payroll Month
                  </div>
                  <div className="sm:w-64">
                    <Select
                      value={payslipFilter}
                      onChange={e => setPayslipFilter(e.target.value)}
                      options={monthFilterOptions}
                    />
                  </div>
                  <p className="text-xs text-gray-500 sm:ml-auto">{visiblePayslips.length} payslip(s)</p>
                </div>

                {visiblePayslips.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg font-medium text-[#17324D] mb-2">No payslips found</p>
                    <p className="text-sm">Finalize a payroll run to generate payslips for this month.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {visiblePayslips.map(slip => (
                      <div key={slip.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8] gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#263238]">{slip.employeeName} — {slip.month} {slip.year}</p>
                          <p className="text-xs text-gray-500">Gross: {money(slip.grossSalary)} | Deductions: {money(slip.deductions.reduce((s, d) => s + d.amount, 0))} | Net: {money(slip.netSalary)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={slip.status === 'Finalized' ? 'success' : slip.status === 'Processed' ? 'info' : 'neutral'}>{slip.status}</Badge>
                          <button onClick={() => setViewSlip(slip)} title="View payslip" className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4]"><Eye size={16} /></button>
                          <button onClick={() => downloadSlip(slip)} title="Download payslip (PDF)" className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4]"><Download size={16} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==================== PAYROLL RUNS ==================== */}
            {activeTab === 'runs' && isAdmin && !selectedRun && (
              <div className="space-y-6">
                <div className="rounded-xl border border-[#D6E4E8] bg-[#EAF2F4]/40 p-5">
                  <h3 className="text-base font-semibold text-[#17324D] mb-1">Start a New Payroll Run</h3>
                  <p className="text-xs text-gray-500 mb-4">Select the payroll month — gross salary, allowances, deductions and approved leave/attendance are calculated automatically for every employee.</p>
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="sm:w-56">
                      <Select
                        label="Payroll Month"
                        value={newMonth}
                        onChange={e => setNewMonth(e.target.value)}
                        options={PAYROLL_MONTHS.map((m, i) => ({ value: String(i), label: m }))}
                      />
                    </div>
                    <div className="sm:w-40">
                      <Select
                        label="Year"
                        value={newYear}
                        onChange={e => setNewYear(e.target.value)}
                        options={PAYROLL_YEARS.map(y => ({ value: String(y), label: String(y) }))}
                      />
                    </div>
                    <Button variant="primary" onClick={startNewRun}>
                      <Calculator size={16} /> Start New Run
                    </Button>
                  </div>
                  {runError && (
                    <p className="mt-3 flex items-center gap-2 text-sm text-red-600"><AlertTriangle size={15} /> {runError}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#17324D] mb-3">Payroll History ({runs.length})</h3>
                  <div className="space-y-3">
                    {runs.map(run => (
                      <div key={run.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-white border border-[#D6E4E8] gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#17324D]">{run.month} {run.year} <span className="font-normal text-gray-400">· {run.id}</span></p>
                          <p className="text-xs text-gray-500 mt-1">
                            {run.items.length} employees · Gross {money(run.totalGross)} · Net {money(run.totalNet)} ·
                            Created {run.createdOn}{run.finalizedOn ? ` · Finalized ${run.finalizedOn}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {runStatusBadge(run.status)}
                          <Button variant="outline" size="sm" onClick={() => setSelectedRunId(run.id)}>
                            <Eye size={14} /> {run.status === 'Finalized' ? 'View' : 'Review'}
                          </Button>
                          <button onClick={() => exportRun(run)} title="Export payroll summary (PDF)" className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4]"><Download size={16} /></button>
                          {run.status === 'Draft' && (
                            confirmDeleteId === run.id ? (
                              <span className="inline-flex items-center gap-2 text-xs">
                                <span className="text-gray-500">Delete?</span>
                                <button onClick={() => deleteRun(run.id)} className="font-semibold text-red-600 hover:underline">Yes</button>
                                <button onClick={() => setConfirmDeleteId(null)} className="font-semibold text-gray-500 hover:underline">No</button>
                              </span>
                            ) : (
                              <button onClick={() => setConfirmDeleteId(run.id)} title="Delete draft run" className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={16} /></button>
                            )
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ==================== RUN DETAIL / REVIEW ==================== */}
            {activeTab === 'runs' && isAdmin && selectedRun && (
              <div className="space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <button onClick={() => setSelectedRunId(null)} className="inline-flex items-center gap-2 text-sm font-medium text-[#0F8B8D] hover:underline">
                    <ArrowLeft size={16} /> All Runs
                  </button>
                  <h3 className="text-lg font-bold text-[#17324D]">{selectedRun.month} {selectedRun.year} <span className="font-normal text-gray-400 text-sm">· {selectedRun.id}</span></h3>
                  <div className="sm:ml-auto flex items-center gap-2">
                    {runStatusBadge(selectedRun.status)}
                    <Button variant="outline" size="sm" onClick={() => exportRun(selectedRun)}>
                      <Download size={14} /> Export PDF
                    </Button>
                  </div>
                </div>

                {/* Review stepper */}
                <div className="flex items-center gap-2 text-xs font-medium">
                  {(['Draft', 'Reviewed', 'Finalized'] as const).map((step, i) => {
                    const order = { Draft: 0, Reviewed: 1, Finalized: 2 };
                    const reached = order[selectedRun.status] >= order[step];
                    return (
                      <React.Fragment key={step}>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${reached ? 'bg-[#0F8B8D] text-white' : 'bg-gray-100 text-gray-400'}`}>
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold">{i + 1}</span>
                          {step}
                        </span>
                        {i < 2 && <span className={`h-0.5 w-8 rounded ${order[selectedRun.status] > i ? 'bg-[#0F8B8D]' : 'bg-gray-200'}`} />}
                      </React.Fragment>
                    );
                  })}
                </div>

                {selectedRun.status === 'Finalized' && (
                  <div className="flex items-start gap-3 rounded-xl border border-[#D6E4E8] bg-[#EAF2F4]/60 p-4 text-sm text-[#17324D]">
                    <Lock size={18} className="mt-0.5 flex-shrink-0 text-[#0F8B8D]" />
                    <p><span className="font-semibold">Locked.</span> Finalized{selectedRun.finalizedOn ? ` on ${selectedRun.finalizedOn}` : ''}{selectedRun.finalizedBy ? ` by ${selectedRun.finalizedBy}` : ''} — no further edits allowed. Payslips are available under the Payslips tab.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard title="Total Gross" value={money(selectedRun.totalGross)} icon={<DollarSign size={22} className="text-green-600" />} iconBg="bg-green-50" />
                  <StatCard title="Total Deductions" value={money(selectedRun.totalDeductions)} icon={<FileText size={22} className="text-red-500" />} iconBg="bg-red-50" />
                  <StatCard title="Total Net Payable" value={money(selectedRun.totalNet)} icon={<Calculator size={22} className="text-[#0F8B8D]" />} iconBg="bg-[#EAF2F4]" />
                </div>

                <div className="overflow-x-auto rounded-xl border border-[#D6E4E8]">
                  <table className="w-full min-w-[880px] text-sm">
                    <thead>
                      <tr className="bg-[#EAF2F4]/60 text-left text-xs uppercase tracking-wide text-gray-500">
                        <th className="px-4 py-3 font-semibold">Employee</th>
                        <th className="px-4 py-3 font-semibold text-right">Basic</th>
                        <th className="px-4 py-3 font-semibold text-right">Allowances</th>
                        <th className="px-4 py-3 font-semibold text-right">Deductions</th>
                        <th className="px-4 py-3 font-semibold text-right">Leave / Absent</th>
                        <th className="px-4 py-3 font-semibold text-right">Gross</th>
                        <th className="px-4 py-3 font-semibold text-right">Net</th>
                        {selectedRun.status === 'Draft' && <th className="px-4 py-3 font-semibold text-right">Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRun.items.map(item => (
                        <tr key={item.employeeId} className="border-t border-[#D6E4E8] hover:bg-[#EAF2F4]/30">
                          <td className="px-4 py-3">
                            <p className="font-medium text-[#263238]">{item.employeeName}</p>
                            {item.department && <p className="text-xs text-gray-500">{item.department}</p>}
                          </td>
                          <td className="px-4 py-3 text-right">{money(item.basicSalary)}</td>
                          <td className="px-4 py-3 text-right text-green-700">+{money(item.totalAllowances)}</td>
                          <td className="px-4 py-3 text-right text-red-600">-{money(item.totalDeductions)}</td>
                          <td className="px-4 py-3 text-right text-xs text-gray-500">
                            {empMonthly[item.employeeId] !== undefined && (
                              <span className="mr-1 rounded bg-blue-100 px-1.5 py-0.5 font-semibold text-blue-700" title="This employee has custom monthly leaves">Custom</span>
                            )}
                            {item.paidLeaveDays > 0 && <span className="mr-1 rounded bg-green-100 px-1.5 py-0.5 text-green-700">{item.paidLeaveDays}d paid</span>}
                            {(item.unpaidLeaveDays + item.absentDays) > 0
                              ? <span className="rounded bg-red-100 px-1.5 py-0.5 text-red-700">{item.unpaidLeaveDays + item.absentDays}d unpaid · -{money(item.leaveDeduction)}</span>
                              : <span>—</span>}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">{money(item.grossSalary)}</td>
                          <td className="px-4 py-3 text-right font-bold text-[#17324D]">{money(item.netSalary)}</td>
                          {selectedRun.status === 'Draft' && (
                            <td className="px-4 py-3 text-right">
                              <button onClick={() => setEditingLine(item)} title="Adjust allowances & deductions" className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4]"><Pencil size={15} /></button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500">Unpaid leave & absence deduction = (monthly basic ÷ {DAILY_RATE_DIVISOR}) × unpaid days. Each employee gets their monthly paid leaves (Monthly Leaves tab); extra approved days are automatically unpaid.</p>

                <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                  {selectedRun.status === 'Draft' && (
                    <Button variant="primary" onClick={() => markReviewed(selectedRun)}>
                      <CheckCircle2 size={16} /> Mark as Reviewed
                    </Button>
                  )}
                  {selectedRun.status === 'Reviewed' && (
                    <>
                      <Button variant="outline" onClick={() => reopenToDraft(selectedRun)}>Reopen to Draft</Button>
                      <Button variant="primary" onClick={() => setShowFinalize(true)}>
                        <Lock size={16} /> Finalize & Lock
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ==================== SALARY STRUCTURES ==================== */}
            {activeTab === 'structures' && isAdmin && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-[#17324D]">Default Salary Components</h3>
                    <p className="text-xs text-gray-500">Applied automatically to every new payroll run. Changes affect future runs only — finalized runs keep their snapshot.</p>
                  </div>
                  <div className="sm:ml-auto flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCompModal({ name: '', amount: '', kind: 'allowance' })}>
                      <Plus size={14} /> Add Allowance
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCompModal({ name: '', amount: '', kind: 'deduction' })}>
                      <Plus size={14} /> Add Deduction
                    </Button>
                  </div>
                </div>

                {(['allowance', 'deduction'] as const).map(kind => (
                  <div key={kind}>
                    <h4 className={`text-sm font-semibold mb-2 ${kind === 'allowance' ? 'text-green-700' : 'text-red-600'}`}>
                      {kind === 'allowance' ? 'Allowances' : 'Deductions'}
                    </h4>
                    <div className="space-y-2">
                      {components.filter(c => c.kind === kind).map(comp => (
                        <div key={comp.id} className="flex items-center justify-between p-3 rounded-lg bg-white border border-[#D6E4E8]">
                          <p className="text-sm font-medium text-[#263238]">{comp.name}</p>
                          <div className="flex items-center gap-3">
                            <p className={`text-sm font-bold ${kind === 'allowance' ? 'text-green-700' : 'text-red-600'}`}>
                              {kind === 'allowance' ? '+' : '-'}{money(comp.amount)}/mo
                            </p>
                            <button onClick={() => setCompModal({ id: comp.id, name: comp.name, amount: String(comp.amount), kind: comp.kind })} title="Edit" className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4]"><Pencil size={15} /></button>
                            <button onClick={() => setComponents(prev => prev.filter(c => c.id !== comp.id))} title="Remove" className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
                          </div>
                        </div>
                      ))}
                      {components.filter(c => c.kind === kind).length === 0 && (
                        <p className="text-sm text-gray-400 py-2">No {kind}s defined.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ==================== MONTHLY LEAVES (separate tab) ==================== */}
            {activeTab === 'emp-rules' && isAdmin && (
              <div className="space-y-4 max-w-3xl">
                <div>
                  <h3 className="text-base font-semibold text-[#17324D]">Monthly Leaves</h3>
                  <p className="text-xs text-gray-500">Paid leave days per employee per month — fresh every month. Approved days within it are fully paid; extra days are automatically unpaid in the payslip.</p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-xl border border-[#D6E4E8] bg-[#EAF2F4]/40 p-4">
                  <div className="sm:w-64">
                    <label className="block text-sm font-medium text-[#263238] mb-1.5">Company default (days/month)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={monthlyDefault}
                      onChange={e => setMonthlyDefault(Math.max(0, Math.round((Number(e.target.value) || 0) * 100) / 100))}
                      className="w-full rounded-lg border border-[#D6E4E8] bg-white px-4 py-2.5 text-sm focus:border-[#0F8B8D] focus:outline-none"
                    />
                  </div>
                  <div className="sm:w-64">
                    <label className="block text-sm font-medium text-[#263238] mb-1.5">Company default fine ($)</label>
                    <input
                      type="number"
                      min={0}
                      step="10"
                      value={fineDefault}
                      onChange={e => setFineDefault(Math.max(0, Math.round(Number(e.target.value) || 0)))}
                      className="w-full rounded-lg border border-[#D6E4E8] bg-white px-4 py-2.5 text-sm focus:border-[#0F8B8D] focus:outline-none"
                    />
                  </div>
                  <p className="text-xs text-gray-500 sm:pb-2.5">Applies to everyone without a custom value below.</p>
                </div>

                <div className="rounded-xl border border-[#D6E4E8] bg-[#EAF2F4]/40 p-5 space-y-4">

                  {Object.keys(empMonthly).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(empMonthly).map(empId => {
                        const emp = mockEmployees.find(e => e.id === empId);
                        if (!emp) return null;
                        return (
                          <span
                            key={empId}
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${overrideEmpId === empId ? 'bg-[#0F8B8D] text-white' : 'bg-white text-[#17324D] border border-[#D6E4E8]'}`}
                          >
                            <button onClick={() => setOverrideEmpId(empId)} className="hover:underline">
                              {emp.firstName} {emp.lastName} · {empMonthly[empId]}d/mo
                            </button>
                            <button
                              onClick={() => {
                                setEmpMonthly(prev => {
                                  const next = { ...prev };
                                  delete next[empId];
                                  return next;
                                });
                                if (overrideEmpId === empId) setOverrideEmpId('');
                              }}
                              title="Remove override (back to company default)"
                              className="font-bold hover:text-red-500"
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="sm:w-80">
                    <Select
                      label="Edit monthly leaves for"
                      value={overrideEmpId}
                      onChange={e => setOverrideEmpId(e.target.value)}
                      options={[
                        { value: '', label: 'Select employee…' },
                        ...mockEmployees.map(e => ({ value: e.id, label: `${e.firstName} ${e.lastName} — ${e.designation}` })),
                      ]}
                    />
                  </div>

                  {overrideEmpId && (() => {
                    const emp = mockEmployees.find(e => e.id === overrideEmpId);
                    if (!emp) return null;
                    const isCustom = empMonthly[overrideEmpId] !== undefined;
                    const effective = resolveMonthlyLeaves(overrideEmpId, monthlyDefault, empMonthly);
                    return (
                      <div className="space-y-3 rounded-lg bg-white border border-[#D6E4E8] p-4">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-[#17324D]">{emp.firstName} {emp.lastName}</p>
                          {isCustom
                            ? <Badge variant="info">Custom: {effective} days/mo</Badge>
                            : <Badge variant="neutral">Company default: {effective} days/mo</Badge>}
                          {isCustom && (
                            <button
                              onClick={() => {
                                setEmpMonthly(prev => {
                                  const next = { ...prev };
                                  delete next[overrideEmpId];
                                  return next;
                                });
                              }}
                              className="text-xs font-semibold text-red-600 hover:underline"
                            >
                              Reset to company
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:w-72">
                          <label className="text-xs text-gray-500 flex-shrink-0">Paid leaves</label>
                          <input
                            type="number"
                            min={0}
                            step="0.5"
                            value={effective}
                            onChange={e => setEmpMonthly(prev => ({
                              ...prev,
                              [overrideEmpId]: Math.max(0, Math.round((Number(e.target.value) || 0) * 100) / 100),
                            }))}
                            className="w-full rounded-lg border border-[#D6E4E8] px-3 py-2 text-sm text-right focus:border-[#0F8B8D] focus:outline-none"
                          />
                          <span className="text-xs text-gray-500 flex-shrink-0">days/mo</span>
                        </div>
                        <div className="flex items-center gap-2 sm:w-72">
                          <label className="text-xs text-gray-500 flex-shrink-0">Manual fine</label>
                          <input
                            type="number"
                            min={0}
                            step="10"
                            value={empFines[overrideEmpId] ?? fineDefault}
                            onChange={e => setEmpFines(prev => ({
                              ...prev,
                              [overrideEmpId]: Math.max(0, Math.round(Number(e.target.value) || 0)),
                            }))}
                            className="w-full rounded-lg border border-[#D6E4E8] px-3 py-2 text-sm text-right focus:border-[#0F8B8D] focus:outline-none"
                          />
                          <span className="text-xs text-gray-500 flex-shrink-0">$</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ============ Payslip view modal ============ */}
      <Modal isOpen={!!viewSlip} onClose={() => setViewSlip(null)} title={viewSlip ? `Payslip — ${viewSlip.month} ${viewSlip.year}` : 'Payslip'} size="lg">
        {viewSlip && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-bold text-[#17324D]">{viewSlip.employeeName}</p>
                <p className="text-xs text-gray-500">Generated {viewSlip.generatedOn}</p>
              </div>
              <Badge variant={viewSlip.status === 'Finalized' ? 'success' : 'info'}>{viewSlip.status}</Badge>
            </div>
            <div className="rounded-xl border border-[#D6E4E8] overflow-hidden">
              <div className="flex justify-between bg-[#EAF2F4]/60 px-4 py-2.5 font-semibold text-[#17324D]">
                <span>Earnings</span><span>Amount</span>
              </div>
              <div className="flex justify-between px-4 py-2 border-t border-[#D6E4E8]"><span>Basic Salary</span><span className="font-medium">{money(viewSlip.basicSalary)}</span></div>
              {viewSlip.allowances.map(a => (
                <div key={a.name} className="flex justify-between px-4 py-2 border-t border-[#D6E4E8] text-gray-600"><span>{a.name}</span><span>+{money(a.amount)}</span></div>
              ))}
              <div className="flex justify-between bg-[#EAF2F4]/40 px-4 py-2.5 border-t border-[#D6E4E8] font-bold text-[#17324D]"><span>Gross Salary</span><span>{money(viewSlip.grossSalary)}</span></div>
            </div>
            <div className="rounded-xl border border-[#D6E4E8] overflow-hidden">
              <div className="flex justify-between bg-red-50 px-4 py-2.5 font-semibold text-red-800">
                <span>Deductions</span><span>Amount</span>
              </div>
              {viewSlip.deductions.map(d => (
                <div key={d.name} className="flex justify-between px-4 py-2 border-t border-[#D6E4E8] text-gray-600"><span>{d.name}</span><span>-{money(d.amount)}</span></div>
              ))}
              <div className="flex justify-between bg-[#17324D] px-4 py-3 font-bold text-white"><span>Net Salary</span><span>{money(viewSlip.netSalary)}</span></div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={() => downloadSlip(viewSlip)}><Download size={14} /> Download</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============ Line edit modal (allowances & deductions) ============ */}
      <Modal isOpen={!!editingLine} onClose={() => setEditingLine(null)} title={editingLine ? `Adjust — ${editingLine.employeeName}` : 'Adjust'} size="lg">
        {editingLine && (
          <LineEditor
            key={editingLine.employeeId}
            line={editingLine}
            onSave={saveEditedLine}
            onCancel={() => setEditingLine(null)}
          />
        )}
      </Modal>

      {/* ============ Finalize confirmation ============ */}
      <Modal isOpen={showFinalize} onClose={() => !busy && setShowFinalize(false)} title="Finalize Payroll" size="sm">
        {selectedRun && (
          <div className="space-y-4 text-sm">
            <p className="text-gray-600">
              Finalize <span className="font-semibold text-[#17324D]">{selectedRun.month} {selectedRun.year}</span>?
              This will <span className="font-semibold">lock the run</span> and generate{' '}
              <span className="font-semibold">{selectedRun.items.length} payslips</span>.
            </p>
            <div className="rounded-xl bg-[#EAF2F4]/60 p-4 space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-500">Total Gross</span><span className="font-bold">{money(selectedRun.totalGross)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Deductions</span><span className="font-bold text-red-600">{money(selectedRun.totalDeductions)}</span></div>
              <div className="flex justify-between border-t border-[#D6E4E8] pt-1.5"><span className="text-gray-500">Total Net Payable</span><span className="font-bold text-[#17324D]">{money(selectedRun.totalNet)}</span></div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowFinalize(false)} disabled={busy}>Cancel</Button>
              <Button variant="primary" onClick={finalizeRun} loading={busy}><Lock size={16} /> Finalize & Lock</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============ Component add/edit modal ============ */}
      <Modal isOpen={!!compModal} onClose={() => setCompModal(null)} title={compModal?.id ? 'Edit Component' : 'Add Component'} size="sm">
        {compModal && (
          <div className="space-y-4">
            <Input
              label="Component Name"
              placeholder="e.g. Overtime, Provident Fund"
              value={compModal.name}
              onChange={e => setCompModal({ ...compModal, name: e.target.value })}
            />
            <Select
              label="Type"
              value={compModal.kind}
              onChange={e => setCompModal({ ...compModal, kind: e.target.value as 'allowance' | 'deduction' })}
              options={[
                { value: 'allowance', label: 'Allowance (+)' },
                { value: 'deduction', label: 'Deduction (−)' },
              ]}
            />
            <Input
              label="Monthly Amount ($)"
              type="number"
              min={0}
              placeholder="0"
              value={compModal.amount}
              onChange={e => setCompModal({ ...compModal, amount: e.target.value })}
            />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setCompModal(null)}>Cancel</Button>
              <Button variant="primary" onClick={saveComponent} disabled={!compModal.name.trim()}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

/* ---------- Inline line-item editor (draft runs only) ---------- */
function LineEditor({ line, onSave, onCancel }: {
  line: PayrollLineItem;
  onSave: (line: PayrollLineItem) => void;
  onCancel: () => void;
}) {
  const [allowances, setAllowances] = useState(line.allowances.map(a => ({ ...a })));
  const [deductions, setDeductions] = useState(line.deductions.map(d => ({ ...d })));

  const preview = recalcLine({ ...line, allowances, deductions });

  const editRow = (
    list: { name: string; amount: number }[],
    setList: (v: { name: string; amount: number }[]) => void,
    idx: number,
    field: 'name' | 'amount',
    value: string,
  ) => {
    setList(list.map((row, i) => (i === idx ? { ...row, [field]: field === 'amount' ? Math.max(0, Math.round(Number(value) || 0)) : value } : row)));
  };

  const renderRows = (
    title: string,
    list: { name: string; amount: number }[],
    setList: (v: { name: string; amount: number }[]) => void,
  ) => (
    <div>
      <p className="text-sm font-semibold text-[#17324D] mb-2">{title}</p>
      <div className="space-y-2">
        {list.map((row, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={row.name}
              onChange={e => editRow(list, setList, i, 'name', e.target.value)}
              className="flex-1 rounded-lg border border-[#D6E4E8] px-3 py-2 text-sm focus:border-[#0F8B8D] focus:outline-none"
              placeholder="Name"
            />
            <input
              type="number"
              min={0}
              value={row.amount}
              onChange={e => editRow(list, setList, i, 'amount', e.target.value)}
              className="w-28 rounded-lg border border-[#D6E4E8] px-3 py-2 text-sm focus:border-[#0F8B8D] focus:outline-none"
              placeholder="0"
            />
            <button
              onClick={() => setList(list.filter((_, j) => j !== i))}
              title="Remove"
              className="p-2 rounded-lg text-red-500 hover:bg-red-50"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        <button
          onClick={() => setList([...list, { name: '', amount: 0 }])}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F8B8D] hover:underline"
        >
          <Plus size={13} /> Add row
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-[#EAF2F4]/60 p-3 text-xs text-gray-600">
        Basic {money(line.basicSalary)} · Paid leave {line.paidLeaveDays}d ·
        Unpaid {(line.unpaidLeaveDays + line.absentDays)}d (−{money(line.leaveDeduction)}, auto from attendance & leave — not editable here)
      </div>
      {renderRows('Allowances', allowances, setAllowances)}
      {renderRows('Deductions', deductions, setDeductions)}
      <div className="flex items-center justify-between rounded-xl bg-[#17324D] px-4 py-3 text-sm font-bold text-white">
        <span>Gross {money(preview.grossSalary)}</span>
        <span>Net {money(preview.netSalary)}</span>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={() => onSave({ ...line, allowances, deductions })}>Save Changes</Button>
      </div>
    </div>
  );
}
