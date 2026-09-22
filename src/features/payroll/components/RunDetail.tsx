'use client';

import React from 'react';
import { ArrowLeft, CheckCircle2, Download, Lock, LockOpen, Pencil } from 'lucide-react';
import Button from '@/components/ui/Button';
import SearchBar from '@/components/ui/SearchBar';
import StatCard from '@/components/ui/StatCard';
import { StatusBadge } from '@/components/shared';
import { formatCurrency as money } from '@/utils';
import type { PayrollLineItem, PayrollRun } from '@/lib/payroll';
import type { EmployeeMonthlyLeaves } from '@/lib/payroll';

interface RunDetailProps {
  run: PayrollRun;
  items: PayrollLineItem[];
  search: string;
  onSearchChange: (v: string) => void;
  empMonthly: EmployeeMonthlyLeaves;
  dailyRateDivisor: number;
  isSuperAdmin: boolean;
  onBack: () => void;
  onExport: () => void;
  onEditLine: (item: PayrollLineItem) => void;
  onMarkReviewed: () => void;
  onReopen: () => void;
  onFinalizeRequest: () => void;
  onUnlockRequest: () => void;
}

export default function RunDetail({
  run, items, search, onSearchChange, empMonthly, dailyRateDivisor,
  isSuperAdmin,
  onBack, onExport, onEditLine, onMarkReviewed, onReopen, onFinalizeRequest, onUnlockRequest,
}: RunDetailProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button onClick={onBack} className="inline-flex items-center gap-2 text-sm font-medium text-[#0F8B8D] hover:underline">
          <ArrowLeft size={16} /> All Runs
        </button>
        <h3 className="text-lg font-bold text-[#17324D]">{run.month} {run.year} <span className="font-normal text-gray-400 text-sm">· {run.id}</span></h3>
        <div className="sm:ml-auto flex items-center gap-2">
          <StatusBadge status={run.status} />
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download size={14} /> Export PDF
          </Button>
        </div>
      </div>

      {/* Review stepper */}
      <div className="flex items-center gap-2 text-xs font-medium">
        {(['Draft', 'Reviewed', 'Finalized'] as const).map((step, i) => {
          const order = { Draft: 0, Reviewed: 1, Finalized: 2 };
          const reached = order[run.status] >= order[step];
          return (
            <React.Fragment key={step}>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${reached ? 'bg-[#0F8B8D] text-white' : 'bg-gray-100 text-gray-400'}`}>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold">{i + 1}</span>
                {step}
              </span>
              {i < 2 && <span className={`h-0.5 w-8 rounded ${order[run.status] > i ? 'bg-[#0F8B8D]' : 'bg-gray-200'}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {run.status === 'Finalized' && (
        <div className="flex items-start gap-3 rounded-xl border border-[#D6E4E8] bg-[#EAF2F4]/60 p-4 text-sm text-[#17324D]">
          <Lock size={18} className="mt-0.5 flex-shrink-0 text-[#0F8B8D]" />
          <div className="flex-1">
            <p><span className="font-semibold">Locked.</span> Finalized{run.finalizedOn ? ` on ${run.finalizedOn}` : ''}{run.finalizedBy ? ` by ${run.finalizedBy}` : ''} — no further edits allowed. Payslips are available under the Payslips tab.</p>
            {!isSuperAdmin && (
              <p className="mt-1 text-xs text-gray-500">Only a Super Admin can unlock this run. Please contact your Super Admin for corrections.</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Gross" value={money(run.totalGross)} iconName="growth" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Total Deductions" value={money(run.totalDeductions)} iconName="decline" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
        <StatCard title="Total Net Payable" value={money(run.totalNet)} iconName="payrollStatus" iconColor="#024fa7" iconBg="bg-gradient-to-br from-[#E3EFFE] to-[#C4DCFA]" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#D6E4E8]">
        <div className="p-3 border-b border-[#D6E4E8]">
          <div className="sm:max-w-xs sm:ml-auto">
            <SearchBar value={search} onChange={onSearchChange} placeholder="Search employee…" />
          </div>
        </div>
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
              {run.status === 'Draft' && <th className="px-4 py-3 font-semibold text-right">Action</th>}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
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
                {run.status === 'Draft' && (
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => onEditLine(item)} title="Adjust allowances & deductions" className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4]"><Pencil size={15} /></button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500">Unpaid leave & absence deduction = (monthly basic ÷ {dailyRateDivisor}) × unpaid days. Each employee gets their monthly paid leaves (Monthly Leaves tab); extra approved days are automatically unpaid.</p>

      <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
        {run.status === 'Draft' && (
          <Button variant="primary" onClick={onMarkReviewed}>
            <CheckCircle2 size={16} /> Mark as Reviewed
          </Button>
        )}
        {run.status === 'Reviewed' && (
          <>
            <Button variant="outline" onClick={onReopen}>Reopen to Draft</Button>
            <Button variant="primary" onClick={onFinalizeRequest}>
              <Lock size={16} /> Finalize & Lock
            </Button>
          </>
        )}
        {run.status === 'Finalized' && isSuperAdmin && (
          <Button variant="outline" onClick={onUnlockRequest} title="Super Admin only — returns the run to Reviewed">
            <LockOpen size={16} /> Unlock Run
          </Button>
        )}
      </div>
    </div>
  );
}
