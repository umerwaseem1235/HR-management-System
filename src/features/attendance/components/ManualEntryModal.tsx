'use client';

import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import type { Employee } from '@/types';
import { todayStr } from '@/utils/date';
import { ADMIN_STATUS_OPTIONS, formatDuration, resolveLateStatus, type LateArrivalRule } from '../utils';

export default function ManualEntryModal({
  open,
  onClose,
  onSave,
  employees,
  lateRule,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (values: { employeeId: string; date: string; checkIn: string; checkOut: string; status: string; notes: string }) => void;
  employees: Employee[];
  lateRule?: LateArrivalRule;
}) {
  const [selectedEmp, setSelectedEmp] = useState('');
  const [date, setDate] = useState(todayStr());
  const [checkIn, setCheckIn] = useState('09:00');
  const [checkOut, setCheckOut] = useState('18:00');
  const [status, setStatus] = useState('Present');
  const [statusTouched, setStatusTouched] = useState(false);
  const [notes, setNotes] = useState('');

  const suggestion = lateRule && checkIn ? resolveLateStatus(checkIn, lateRule) : null;

  // Auto-suggest status from the late-arrival rule until the admin overrides it.
  useEffect(() => {
    if (!suggestion || !lateRule?.enabled || statusTouched) return;
    if (['Present', 'Late', 'Half Day'].includes(status)) setStatus(suggestion.status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, lateRule?.graceMinutes, lateRule?.halfDayAfterMinutes, lateRule?.enabled]);

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
            onChange={(e) => { setStatus(e.target.value); setStatusTouched(true); }}
            options={ADMIN_STATUS_OPTIONS}
            required
          />
          <Input label="Check In" type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          <Input label="Check Out" type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          {suggestion && lateRule?.enabled && suggestion.minutesLate > 0 && (
            <p className="sm:col-span-2 text-xs leading-relaxed text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5">
              Late-arrival rule: {formatDuration(suggestion.minutesLate)} late → auto-marked{' '}
              <span className="font-semibold">{suggestion.status}</span>.
              {suggestion.status === 'Half Day' && ' Exceeds the configured threshold.'}
            </p>
          )}
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
