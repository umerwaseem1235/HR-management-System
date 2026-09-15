'use client';

import { Calculator, CheckCircle2, Lock, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import Tabs from '@/components/ui/Tabs';
import { formatCurrency as money } from '@/utils';
import { mockEmployees } from '@/lib/mock-data';
import { usePayroll } from '../hooks/usePayroll';
import ComponentModal from './ComponentModal';
import LineEditor from './LineEditor';
import MonthlyLeaves from './MonthlyLeaves';
import PayslipList from './PayslipList';
import PayrollRuns from './PayrollRuns';
import RunDetail from './RunDetail';
import SalaryStructure from './SalaryStructure';

export default function PayrollView() {
  const p = usePayroll();
  const { isAdmin, activeTab, setActiveTab, tabs } = p;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll"
        actions={isAdmin && (
          <Button variant="primary" onClick={() => setActiveTab('runs')}>
            <Calculator size={16} /> Process Payroll
          </Button>
        )}
      />

      {p.successMsg && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 size={18} className="mt-0.5 flex-shrink-0" />
          <p className="flex-1">{p.successMsg}</p>
          <button onClick={() => p.setSuccessMsg('')} className="font-semibold hover:underline">Dismiss</button>
        </div>
      )}

      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="Monthly Payroll" value={money(p.totalPayroll / 12)} iconName="payroll" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
          <StatCard title="Total Employees" value={mockEmployees.length} iconName="totalEmployees" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
          <StatCard title="Payroll Status" value={p.payrollStatus} iconName="payrollStatus" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        </div>
      )}

      <Card padding="none">
        <div className="px-6 pt-4"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
        <div className="p-6">

          {/* ==================== PAYSLIPS ==================== */}
          {activeTab === 'payslips' && (
            <PayslipList
              slips={p.visiblePayslips}
              month={p.payslipMonth}
              onMonthChange={p.setPayslipMonth}
              search={p.payslipSearch}
              onSearchChange={p.setPayslipSearch}
              viewSlip={p.viewSlip}
              onView={p.setViewSlip}
              onDownload={p.downloadSlip}
            />
          )}

          {/* ==================== PAYROLL RUNS ==================== */}
          {activeTab === 'runs' && isAdmin && !p.selectedRun && (
            <PayrollRuns
              runs={p.visibleRuns}
              newMonth={p.newMonth}
              onNewMonthChange={p.setNewMonth}
              newYear={p.newYear}
              onNewYearChange={p.setNewYear}
              runError={p.runError}
              onStart={p.startNewRun}
              search={p.runSearch}
              onSearchChange={p.setRunSearch}
              monthOptions={p.PAYROLL_MONTHS.map((m, i) => ({ value: String(i), label: m }))}
              yearOptions={p.PAYROLL_YEARS.map(y => ({ value: String(y), label: String(y) }))}
              onReview={p.setSelectedRunId}
              onExport={p.exportRun}
              onDeleteRequest={p.setConfirmDeleteRun}
            />
          )}

          {/* ==================== RUN DETAIL / REVIEW ==================== */}
          {activeTab === 'runs' && isAdmin && p.selectedRun && (
            <RunDetail
              run={p.selectedRun}
              items={p.visibleRunItems}
              search={p.runDetailSearch}
              onSearchChange={p.setRunDetailSearch}
              empMonthly={p.empMonthly}
              dailyRateDivisor={p.DAILY_RATE_DIVISOR}
              onBack={() => p.setSelectedRunId(null)}
              onExport={() => p.exportRun(p.selectedRun!)}
              onEditLine={p.setEditingLine}
              onMarkReviewed={() => p.markReviewed(p.selectedRun!)}
              onReopen={() => p.reopenToDraft(p.selectedRun!)}
              onFinalizeRequest={() => p.setShowFinalize(true)}
            />
          )}

          {/* ==================== SALARY STRUCTURES ==================== */}
          {activeTab === 'structures' && isAdmin && (
            <SalaryStructure
              components={p.components}
              onAdd={p.setCompModal}
              onEdit={p.setCompModal}
              onRemove={p.removeComponent}
            />
          )}

          {/* ==================== MONTHLY LEAVES (separate tab) ==================== */}
          {activeTab === 'emp-rules' && isAdmin && (
            <MonthlyLeaves
              monthlyDefault={p.monthlyDefault}
              onMonthlyDefaultChange={p.setMonthlyDefault}
              fineDefault={p.fineDefault}
              onFineDefaultChange={p.setFineDefault}
              empMonthly={p.empMonthly}
              onEmpMonthlyChange={p.setEmpMonthly}
              empFines={p.empFines}
              onEmpFinesChange={p.setEmpFines}
              overrideEmpId={p.overrideEmpId}
              onOverrideEmpIdChange={p.setOverrideEmpId}
              resolveMonthlyLeaves={p.resolveMonthlyLeaves}
            />
          )}
        </div>
      </Card>

      {/* ============ Line edit modal (allowances & deductions) ============ */}
      <Modal isOpen={!!p.editingLine} onClose={() => p.setEditingLine(null)} title={p.editingLine ? `Adjust — ${p.editingLine.employeeName}` : 'Adjust'} size="lg">
        {p.editingLine && (
          <LineEditor
            key={p.editingLine.employeeId}
            line={p.editingLine}
            onSave={p.saveEditedLine}
            onCancel={() => p.setEditingLine(null)}
          />
        )}
      </Modal>

      {/* ============ Finalize confirmation ============ */}
      <ConfirmDialog
        isOpen={p.showFinalize && !!p.selectedRun}
        onClose={() => !p.busy && p.setShowFinalize(false)}
        title="Finalize Payroll"
        variant="info"
        icon={<Lock size={20} className="text-[#024fa7]" />}
        headline={
          <>
            Finalize <span className="font-semibold text-[#17324D]">{p.selectedRun?.month} {p.selectedRun?.year}</span>?
            This will <span className="font-semibold">lock the run</span> and generate{' '}
            <span className="font-semibold">{p.selectedRun?.items.length} payslips</span>.
          </>
        }
        confirmLabel="Finalize & Lock"
        confirmIcon={<Lock size={16} />}
        onConfirm={p.finalizeRun}
        loading={p.busy}
      >
        {p.selectedRun && (
          <div className="rounded-xl bg-[#EAF2F4]/60 p-4 space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Total Gross</span><span className="font-bold">{money(p.selectedRun.totalGross)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Deductions</span><span className="font-bold text-red-600">{money(p.selectedRun.totalDeductions)}</span></div>
            <div className="flex justify-between border-t border-[#D6E4E8] pt-1.5"><span className="text-gray-500">Total Net Payable</span><span className="font-bold text-[#17324D]">{money(p.selectedRun.totalNet)}</span></div>
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={!!p.confirmDeleteRun}
        onClose={() => p.setConfirmDeleteRun(null)}
        title="Delete Payroll Run?"
        variant="delete"
        headline={
          <>
            Delete <span className="font-semibold text-[#17324D]">{p.confirmDeleteRun?.month} {p.confirmDeleteRun?.year}</span> draft run?
          </>
        }
        subline={p.confirmDeleteRun ? `${p.confirmDeleteRun.items.length} employees · Gross ${money(p.confirmDeleteRun.totalGross)} · Net ${money(p.confirmDeleteRun.totalNet)}` : undefined}
        note={
          <>
            This action <span className="font-semibold">cannot be undone</span>. The draft run will be permanently removed.
          </>
        }
        confirmLabel="Delete"
        confirmIcon={<Trash2 size={16} />}
        onConfirm={() => { if (p.confirmDeleteRun) p.deleteRun(p.confirmDeleteRun.id); }}
      />

      {/* ============ Component add/edit modal ============ */}
      <ComponentModal
        modal={p.compModal}
        onClose={() => p.setCompModal(null)}
        onChange={p.setCompModal}
        onSave={p.saveComponent}
      />
    </div>
  );
}
