'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatCurrency as money } from '@/utils';
import type { SalaryComponent } from '@/lib/payroll';
import type { CompModalState } from '../hooks/usePayroll';

interface SalaryStructureProps {
  components: SalaryComponent[];
  onAdd: (modal: CompModalState) => void;
  onEdit: (modal: CompModalState) => void;
  onRemove: (id: string) => void;
}

export default function SalaryStructure({ components, onAdd, onEdit, onRemove }: SalaryStructureProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#17324D]">Default Salary Components</h3>
          <p className="text-xs text-gray-500">Applied automatically to every new payroll run. Changes affect future runs only — finalized runs keep their snapshot.</p>
        </div>
        <div className="sm:ml-auto flex gap-2 flex-wrap items-center">
          <Button variant="outline" size="sm" onClick={() => onAdd({ name: '', amount: '', kind: 'allowance' })}>
            <Plus size={14} /> Add Allowance
          </Button>
          <Button variant="outline" size="sm" onClick={() => onAdd({ name: '', amount: '', kind: 'deduction' })}>
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
                  <button onClick={() => onEdit({ id: comp.id, name: comp.name, amount: String(comp.amount), kind: comp.kind })} title="Edit" className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4]"><Pencil size={15} /></button>
                  <button onClick={() => onRemove(comp.id)} title="Remove" className="p-2 rounded-lg text-red-500 hover:bg-red-50"><Trash2 size={15} /></button>
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
  );
}
