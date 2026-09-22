'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import type { Employee } from '@/types';
import { todayStr } from '@/utils/date';
import { ADMIN_STATUS_OPTIONS } from '../utils';

export default function ManualEntryModal({
  open,
  onClose,
  onSave,
  employees,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (values: { employeeId: string; date: string; checkIn: string; checkOut: string; status: string; notes: string }) => void;
  employees: Employee[];
}) {
  const [selectedEmp, setSelectedEmp] = useState('');
  const [date, setDate] = useState(todayStr());
  const [checkIn, setCheckIn] = useState('09:00');
  const [checkOut, setCheckOut] = useState('18:00');
  const [status, setStatus] = useState('Present');
  const [notes, setNotes] = useState('');

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEmp || !date) return;
    onSave({ employeeId: selectedEmp, date, checkIn, checkOut, status, notes });
    setSelectedEmp('');
    setCheckIn('09:00');
    setCheckOut('18:00');
    setStatus('Present');
    setNotes('');
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Authorized Manual Attendance Entry" size="lg">
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Select
              label="Employee"
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
              options={[
                { value: '', label: 'Select employee...' },
                ...employees.map((e) => ({
                  value: e.id,
                  label: `${e.firstName} ${e.lastName} (${e.employeeCode})`,
                })),
              ]}
              required
            />
          </div>
          <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={ADMIN_STATUS_OPTIONS}
            required
          />
          <Input label="Check In" type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          <Input label="Check Out" type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Notes" placeholder="Reason for manual entry (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-[#D6E4E8]">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit"><UserPlus size={16} /> Save Entry</Button>
        </div>
      </form>
    </Modal>
  );
}
