'use client';

import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import { mockEmployees } from '@/lib/mock-data';
import type { EmployeeMonthlyFines, EmployeeMonthlyLeaves } from '@/lib/payroll';
import NumberField from './NumberField';
import type { Dispatch, SetStateAction } from 'react';

interface MonthlyLeavesProps {
  monthlyDefault: number;
  onMonthlyDefaultChange: (n: number) => void;
  fineDefault: number;
  onFineDefaultChange: (n: number) => void;
  empMonthly: EmployeeMonthlyLeaves;
  onEmpMonthlyChange: Dispatch<SetStateAction<EmployeeMonthlyLeaves>>;
  empFines: EmployeeMonthlyFines;
  onEmpFinesChange: Dispatch<SetStateAction<EmployeeMonthlyFines>>;
  overrideEmpId: string;
  onOverrideEmpIdChange: (v: string) => void;
  resolveMonthlyLeaves: (empId: string, monthlyDefault: number, empMonthly: EmployeeMonthlyLeaves) => number;
}

export default function MonthlyLeaves({
  monthlyDefault, onMonthlyDefaultChange, fineDefault, onFineDefaultChange,
  empMonthly, onEmpMonthlyChange, empFines, onEmpFinesChange,
  overrideEmpId, onOverrideEmpIdChange, resolveMonthlyLeaves,
}: MonthlyLeavesProps) {
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h3 className="text-base font-semibold text-[#17324D]">Monthly Leaves</h3>
        <p className="text-xs text-gray-500">Paid leave days per employee per month — fresh every month. Approved days within it are fully paid; extra days are automatically unpaid in the payslip.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3 rounded-xl border border-[#D6E4E8] bg-[#EAF2F4]/40 p-4">
        <div className="sm:w-64">
          <label className="block text-sm font-medium text-[#263238] mb-1.5">Company default (days/month)</label>
          <NumberField
            value={monthlyDefault}
            step="0.5"
            onCommit={n => onMonthlyDefaultChange(Math.max(0, Math.round(n * 100) / 100))}
            className="w-full rounded-lg border border-[#D6E4E8] bg-white px-4 py-2.5 text-sm focus:border-[#0F8B8D] focus:outline-none"
          />
        </div>
        <div className="sm:w-64">
          <label className="block text-sm font-medium text-[#263238] mb-1.5">Company default fine ($)</label>
          <NumberField
            value={fineDefault}
            step="10"
            onCommit={n => onFineDefaultChange(Math.max(0, Math.round(n)))}
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
                  <button onClick={() => onOverrideEmpIdChange(empId)} className="hover:underline">
                    {emp.firstName} {emp.lastName} · {empMonthly[empId]}d/mo
                  </button>
                  <button
                    onClick={() => {
                      onEmpMonthlyChange(prev => {
                        const next = { ...prev };
                        delete next[empId];
                        return next;
                      });
                      if (overrideEmpId === empId) onOverrideEmpIdChange('');
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
            onChange={e => onOverrideEmpIdChange(e.target.value)}
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
                      onEmpMonthlyChange(prev => {
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
              <div className="grid grid-cols-[96px_130px_60px] items-center justify-start gap-2">
                <label className="text-[13px] text-gray-500 whitespace-nowrap">Paid leaves</label>
                <NumberField
                  key={`leaves-${overrideEmpId}`}
                  value={effective}
                  step="0.5"
                  onCommit={n => onEmpMonthlyChange(prev => ({
                    ...prev,
                    [overrideEmpId]: Math.max(0, Math.round(n * 100) / 100),
                  }))}
                  className="h-9 w-full min-w-0 rounded-lg border border-[#D6E4E8] px-3 text-sm text-center tabular-nums focus:border-[#0F8B8D] focus:outline-none"
                />
                <span className="text-[13px] text-gray-500 whitespace-nowrap">days/mo</span>
              </div>
              <div className="grid grid-cols-[96px_130px_60px] items-center justify-start gap-2">
                <label className="text-[13px] text-gray-500 whitespace-nowrap">Manual fine</label>
                <NumberField
                  key={`fine-${overrideEmpId}`}
                  value={empFines[overrideEmpId] ?? fineDefault}
                  step="10"
                  onCommit={n => onEmpFinesChange(prev => ({
                    ...prev,
                    [overrideEmpId]: Math.max(0, Math.round(n)),
                  }))}
                  className="h-9 w-full min-w-0 rounded-lg border border-[#D6E4E8] px-3 text-sm text-center tabular-nums focus:border-[#0F8B8D] focus:outline-none"
                />
                <span className="text-[13px] text-gray-500 whitespace-nowrap">$</span>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
