'use client';

import { useState } from 'react';
import { Download, Lock, Plus, Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import type { Payslip } from '../../lib/types';
import type { PayrollLineItem, PayrollRun } from '../../lib/payroll';
import { recalcLine } from '../../lib/payroll';
import type { CompModalState } from './types';
import { money } from './payroll-helpers';
import NumberField from './NumberField';

/* ---------- Payslip view modal ---------- */
export function PayslipViewModal({ slip, onClose, onDownload }: { slip: Payslip | null; onClose: () => void; onDownload: (s: Payslip) => void }) {
  return (
    <Modal isOpen={!!slip} onClose={onClose} title={slip ? `Payslip — ${slip.month} ${slip.year}` : 'Payslip'} size="lg">
      {slip && (
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-bold text-[#17324D]">{slip.employeeName}</p>
              <p className="text-xs text-gray-500">Generated {slip.generatedOn}</p>
            </div>
            <Badge variant={slip.status === 'Finalized' ? 'success' : 'info'}>{slip.status}</Badge>
          </div>
          <div className="rounded-xl border border-[#D6E4E8] overflow-hidden">
            <div className="flex justify-between bg-[#EAF2F4]/60 px-4 py-2.5 font-semibold text-[#17324D]">
              <span>Earnings</span><span>Amount</span>
            </div>
            <div className="flex justify-between px-4 py-2 border-t border-[#D6E4E8]"><span>Basic Salary</span><span className="font-medium">{money(slip.basicSalary)}</span></div>
            {slip.allowances.map(a => (
              <div key={a.name} className="flex justify-between px-4 py-2 border-t border-[#D6E4E8] text-gray-600"><span>{a.name}</span><span>+{money(a.amount)}</span></div>
            ))}
            <div className="flex justify-between bg-[#EAF2F4]/40 px-4 py-2.5 border-t border-[#D6E4E8] font-bold text-[#17324D]"><span>Gross Salary</span><span>{money(slip.grossSalary)}</span></div>
          </div>
          <div className="rounded-xl border border-[#D6E4E8] overflow-hidden">
            <div className="flex justify-between bg-red-50 px-4 py-2.5 font-semibold text-red-800">
              <span>Deductions</span><span>Amount</span>
            </div>
            {slip.deductions.map(d => (
              <div key={d.name} className="flex justify-between px-4 py-2 border-t border-[#D6E4E8] text-gray-600"><span>{d.name}</span><span>-{money(d.amount)}</span></div>
            ))}
            <div className="flex justify-between bg-[#17324D] px-4 py-3 font-bold text-white"><span>Net Salary</span><span>{money(slip.netSalary)}</span></div>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => onDownload(slip)}><Download size={14} /> Download</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ---------- Inline line-item editor (draft runs only) ---------- */
export function LineEditor({ line, onSave, onCancel }: {
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

export function LineEditorModal({ line, onClose, onSave }: { line: PayrollLineItem | null; onClose: () => void; onSave: (l: PayrollLineItem) => void }) {
  return (
    <Modal isOpen={!!line} onClose={onClose} title={line ? `Adjust — ${line.employeeName}` : 'Adjust'} size="lg">
      {line && <LineEditor key={line.employeeId} line={line} onSave={onSave} onCancel={onClose} />}
    </Modal>
  );
}

export function FinalizeModal({ run, open, busy, onClose, onConfirm }: { run: PayrollRun | null; open: boolean; busy: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <Modal isOpen={open} onClose={() => !busy && onClose()} title="Finalize Payroll" size="sm">
      {run && (
        <div className="space-y-4 text-sm">
          <p className="text-gray-600">
            Finalize <span className="font-semibold text-[#17324D]">{run.month} {run.year}</span>?
            This will <span className="font-semibold">lock the run</span> and generate{' '}
            <span className="font-semibold">{run.items.length} payslips</span>.
          </p>
          <div className="rounded-xl bg-[#EAF2F4]/60 p-4 space-y-1.5">
            <div className="flex justify-between"><span className="text-gray-500">Total Gross</span><span className="font-bold">{money(run.totalGross)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Deductions</span><span className="font-bold text-red-600">{money(run.totalDeductions)}</span></div>
            <div className="flex justify-between border-t border-[#D6E4E8] pt-1.5"><span className="text-gray-500">Total Net Payable</span><span className="font-bold text-[#17324D]">{money(run.totalNet)}</span></div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
            <Button variant="primary" onClick={onConfirm} loading={busy}><Lock size={16} /> Finalize & Lock</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function ComponentModal({ draft, onChange, onClose, onSave }: {
  draft: CompModalState | null;
  onChange: (d: CompModalState) => void;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <Modal isOpen={!!draft} onClose={onClose} title={draft?.id ? 'Edit Component' : 'Add Component'} size="sm">
      {draft && (
        <div className="space-y-4">
          <Input
            label="Component Name"
            placeholder="e.g. Overtime, Provident Fund"
            value={draft.name}
            onChange={e => onChange({ ...draft, name: e.target.value })}
          />
          <Select
            label="Type"
            value={draft.kind}
            onChange={e => onChange({ ...draft, kind: e.target.value as 'allowance' | 'deduction' })}
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
            value={draft.amount}
            onChange={e => onChange({ ...draft, amount: e.target.value })}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={onSave} disabled={!draft.name.trim()}>Save</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
