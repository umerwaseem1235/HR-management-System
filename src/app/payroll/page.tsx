'use client';

import { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import { Calculator, CheckCircle2 } from 'lucide-react';
import type { Payslip } from '../../lib/types';
import { mockPayslips, mockEmployees, mockLeaveRequests, mockAttendance } from '../../lib/mock-data';
import { useAuth } from '../../contexts/AuthContext';
import {
  PAYROLL_MONTHS,
  DEFAULT_COMPONENTS, createRun, recalcLine, calcRunTotals,
  runToPayslips, todayISO, seedDecember2023Run,
  DEFAULT_MONTHLY_PAID_LEAVES,
} from '../../lib/payroll';
import type { PayrollRun, PayrollLineItem, SalaryComponent, EmployeeMonthlyLeaves, EmployeeMonthlyFines } from '../../lib/payroll';
import { payslipToPDF, runSummaryToPDF, downloadBlob } from '../../lib/payroll-pdf';
import { money } from '../../components/payroll/payroll-helpers';
import type { CompModalState } from '../../components/payroll/types';
import PayslipsTab from '../../components/payroll/PayslipsTab';
import RunsTab from '../../components/payroll/RunsTab';
import RunDetail from '../../components/payroll/RunDetail';
import StructuresTab from '../../components/payroll/StructuresTab';
import MonthlyLeavesTab from '../../components/payroll/MonthlyLeavesTab';
import { PayslipViewModal, LineEditorModal, FinalizeModal, ComponentModal } from '../../components/payroll/PayrollModals';

export default function PayrollPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('payslips');
  const isAdmin = user?.role !== 'employee';

  // ---- Core state: payslips (history), runs (history), salary structure ----
  const [payslips, setPayslips] = useState<Payslip[]>(mockPayslips);
  const [runs, setRuns] = useState<PayrollRun[]>(() => [seedDecember2023Run(mockPayslips)]);
  const [components, setComponents] = useState<SalaryComponent[]>(DEFAULT_COMPONENTS);
  // Monthly leaves: paid leave days per employee per month (fresh every month).
  const [monthlyDefault, setMonthlyDefault] = useState(DEFAULT_MONTHLY_PAID_LEAVES);
  const [empMonthly, setEmpMonthly] = useState<EmployeeMonthlyLeaves>({});
  const [empFines, setEmpFines] = useState<EmployeeMonthlyFines>({});
  const [fineDefault, setFineDefault] = useState(0);
  const [overrideEmpId, setOverrideEmpId] = useState('');

  // ---- Payslips tab: month filter + view ----
  const [payslipFilter, setPayslipFilter] = useState('all');
  const [payslipSearch, setPayslipSearch] = useState('');
  const [runSearch, setRunSearch] = useState('');
  const [runDetailSearch, setRunDetailSearch] = useState('');
  const [compSearch, setCompSearch] = useState('');
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
  const [compModal, setCompModal] = useState<CompModalState | null>(null);

  const selectedRun = runs.find(r => r.id === selectedRunId) || null;

  const visiblePayslips = useMemo(() => {
    let list = payslips;
    if (!isAdmin && user) list = list.filter(p => p.employeeName === user.name);
    if (payslipFilter !== 'all') {
      const [m, y] = payslipFilter.split('|');
      list = list.filter(p => p.month === m && String(p.year) === y);
    }
    if (payslipSearch.trim()) list = list.filter(p => p.employeeName.toLowerCase().includes(payslipSearch.trim().toLowerCase()));
    return list;
  }, [payslips, payslipFilter, payslipSearch, isAdmin, user]);

  const visibleRuns = useMemo(() => {
    if (!runSearch.trim()) return runs;
    return runs.filter(r => `${r.month} ${r.year} ${r.id} ${r.status}`.toLowerCase().includes(runSearch.trim().toLowerCase()));
  }, [runs, runSearch]);

  const visibleRunItems = useMemo(() => {
    if (!selectedRun) return [];
    if (!runDetailSearch.trim()) return selectedRun.items;
    return selectedRun.items.filter(i => `${i.employeeName} ${i.department || ''}`.toLowerCase().includes(runDetailSearch.trim().toLowerCase()));
  }, [selectedRun, runDetailSearch]);

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
          title="Payroll"
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
            <StatCard title="Monthly Payroll" value={money(totalPayroll / 12)} iconName="payroll" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
            <StatCard title="Total Employees" value={mockEmployees.length} iconName="totalEmployees" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
            <StatCard title="Payroll Status" value={payrollStatus} iconName="payrollStatus" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
          </div>
        )}

        <Card padding="none">
          <div className="px-6 pt-4"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
          <div className="p-6">
            {activeTab === 'payslips' && (
              <PayslipsTab
                slips={visiblePayslips}
                filter={payslipFilter}
                filterOptions={monthFilterOptions}
                search={payslipSearch}
                onFilter={setPayslipFilter}
                onSearch={setPayslipSearch}
                onView={setViewSlip}
                onDownload={downloadSlip}
              />
            )}

            {activeTab === 'runs' && isAdmin && !selectedRun && (
              <RunsTab
                runs={visibleRuns}
                newMonth={newMonth}
                newYear={newYear}
                runError={runError}
                search={runSearch}
                confirmDeleteId={confirmDeleteId}
                onMonthChange={setNewMonth}
                onYearChange={setNewYear}
                onStartRun={startNewRun}
                onSearch={setRunSearch}
                onReview={setSelectedRunId}
                onExport={exportRun}
                onDelete={deleteRun}
                onConfirmDelete={setConfirmDeleteId}
              />
            )}

            {activeTab === 'runs' && isAdmin && selectedRun && (
              <RunDetail
                run={selectedRun}
                items={visibleRunItems}
                search={runDetailSearch}
                empMonthly={empMonthly}
                onSearch={setRunDetailSearch}
                onBack={() => setSelectedRunId(null)}
                onExport={exportRun}
                onEditLine={setEditingLine}
                onMarkReviewed={markReviewed}
                onReopen={reopenToDraft}
                onFinalize={() => setShowFinalize(true)}
              />
            )}

            {activeTab === 'structures' && isAdmin && (
              <StructuresTab
                components={components}
                search={compSearch}
                onSearch={setCompSearch}
                onAdd={kind => setCompModal({ name: '', amount: '', kind })}
                onEdit={c => setCompModal({ id: c.id, name: c.name, amount: String(c.amount), kind: c.kind })}
                onRemove={id => setComponents(prev => prev.filter(c => c.id !== id))}
              />
            )}

            {activeTab === 'emp-rules' && isAdmin && (
              <MonthlyLeavesTab
                employees={mockEmployees}
                monthlyDefault={monthlyDefault}
                fineDefault={fineDefault}
                empMonthly={empMonthly}
                empFines={empFines}
                overrideEmpId={overrideEmpId}
                onMonthlyDefault={setMonthlyDefault}
                onFineDefault={setFineDefault}
                onEmpMonthly={(empId, n) => {
                  if (n === null) {
                    setEmpMonthly(prev => {
                      const next = { ...prev };
                      delete next[empId];
                      return next;
                    });
                  } else {
                    setEmpMonthly(prev => ({ ...prev, [empId]: n }));
                  }
                }}
                onEmpFine={(empId, n) => setEmpFines(prev => ({ ...prev, [empId]: n }))}
                onOverrideEmp={setOverrideEmpId}
                onRemoveOverride={empId => {
                  setEmpMonthly(prev => {
                    const next = { ...prev };
                    delete next[empId];
                    return next;
                  });
                  if (overrideEmpId === empId) setOverrideEmpId('');
                }}
              />
            )}
          </div>
        </Card>
      </div>

      <PayslipViewModal slip={viewSlip} onClose={() => setViewSlip(null)} onDownload={downloadSlip} />
      <LineEditorModal line={editingLine} onClose={() => setEditingLine(null)} onSave={saveEditedLine} />
      <FinalizeModal run={selectedRun} open={showFinalize} busy={busy} onClose={() => setShowFinalize(false)} onConfirm={finalizeRun} />
      <ComponentModal draft={compModal} onChange={setCompModal} onClose={() => setCompModal(null)} onSave={saveComponent} />
    </DashboardLayout>
  );
}
