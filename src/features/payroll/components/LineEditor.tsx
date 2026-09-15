'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { formatCurrency as money } from '@/utils';
import { recalcLine } from '@/lib/payroll';
import type { PayrollLineItem } from '@/lib/payroll';
import NumberField from './NumberField';

/* ---------- Inline line-item editor (draft runs only) ---------- */
export default function LineEditor({ line, onSave, onCancel }: {
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
            <NumberField
              value={row.amount}
              step="10"
              onCommit={v => editRow(list, setList, i, 'amount', String(v))}
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
