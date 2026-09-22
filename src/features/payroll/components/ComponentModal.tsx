'use client';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import type { CompModalState } from '../hooks/usePayroll';

interface ComponentModalProps {
  modal: CompModalState | null;
  onClose: () => void;
  onChange: (modal: CompModalState) => void;
  onSave: () => void;
}

export default function ComponentModal({ modal, onClose, onChange, onSave }: ComponentModalProps) {
  return (
    <Modal isOpen={!!modal} onClose={onClose} title={modal?.id ? 'Edit Component' : 'Add Component'} size="sm">
      {modal && (
        <div className="space-y-4">
          <Input
            label="Component Name"
            placeholder="e.g. Overtime, Provident Fund"
            value={modal.name}
            onChange={e => onChange({ ...modal, name: e.target.value })}
          />
          <Select
            label="Type"
            value={modal.kind}
            onChange={e => onChange({ ...modal, kind: e.target.value as 'allowance' | 'deduction' })}
            options={[
              { value: 'allowance', label: 'Allowance (+)' },
              { value: 'deduction', label: 'Deduction (−)' },
            ]}
          />
          <Input
            label="Monthly Amount (PKR)"
            type="number"
            min={0}
            placeholder="0"
            value={modal.amount}
            onChange={e => onChange({ ...modal, amount: e.target.value })}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={onSave} disabled={!modal.name.trim()}>Save</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
