'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import type { AttendanceRecord } from '@/types';
import { timeToMinutes } from '@/utils/date';
import { ADMIN_STATUS_OPTIONS } from '../utils';

export default function EditAttendanceModal({
  record,
  onClose,
  onSave,
}: {
  record: AttendanceRecord;
  onClose: () => void;
  onSave: (id: string, values: { checkIn: string; checkOut: string; status: string; notes: string }) => void;
}) {
  const [checkIn, setCheckIn] = useState(record.checkIn || '');
  const [checkOut, setCheckOut] = useState(record.checkOut || '');
  const [status, setStatus] = useState<string>(record.status);
  const [notes, setNotes] = useState(record.notes || '');

  const inMin = checkIn ? timeToMinutes(checkIn) : 0;
  const outMin = checkOut ? timeToMinutes(checkOut) : 0;
  const previewHours =
    inMin && outMin && outMin > inMin
      ? Math.round(((outMin - inMin) / 60) * 10) / 10
      : status === 'Present' || status === 'Late'
        ? 8
        : status === 'Half Day'
          ? 4
          : 0;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(record.id, { checkIn, checkOut, status, notes });
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit Attendance Record" size="lg">
      <form onSubmit={submit} className="space-y-5">
        <div className="flex items-center gap-3 rounded-xl border border-[#D6E4E8] bg-[#F8FBFC] px-4 py-3">
          <Avatar name={record.employeeName} size="sm" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#17324D]">{record.employeeName}</p>
            <p className="text-xs text-gray-500">{record.date} · currently {record.status} · {record.workHours}h</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={ADMIN_STATUS_OPTIONS}
            required
          />
          <div className="rounded-lg border border-[#D6E4E8] bg-[#EAF2F4]/60 px-4 py-2.5 self-end">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Work Hours</p>
            <p className="text-sm font-bold text-[#17324D]">{previewHours}h <span className="font-normal text-gray-400">(auto)</span></p>
          </div>
          <Input label="Check In" type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          <Input label="Check Out" type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Notes" placeholder="Reason for correction (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-[#D6E4E8]">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary"><Pencil size={16} /> Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}
