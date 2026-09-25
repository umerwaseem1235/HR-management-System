'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import type { AttendanceRecord } from '@/types';
import { timeToMinutes, formatWorkHours } from '@/utils/date';
import { ADMIN_STATUS_OPTIONS, formatDuration, resolveLateStatus, type LateArrivalRule } from '../utils';

export default function EditAttendanceModal({
  record,
  onClose,
  onSave,
  onDelete,
  lateRule,
}: {
  record: AttendanceRecord;
  onClose: () => void;
  onSave: (id: string, values: { checkIn: string; checkOut: string; status: string; notes: string }) => void;
  onDelete?: (id: string) => void;
  lateRule?: LateArrivalRule;
}) {
  const [checkIn, setCheckIn] = useState(record.checkIn || '');
  const [checkOut, setCheckOut] = useState(record.checkOut || '');
  const [status, setStatus] = useState<string>(record.status);
  const [statusTouched, setStatusTouched] = useState(false);
  const [notes, setNotes] = useState(record.notes || '');

  const suggestion = lateRule && checkIn ? resolveLateStatus(checkIn, lateRule) : null;

  // Auto-suggest status from the late-arrival rule until the admin overrides
  // it. Adjusted during render (instead of an effect) to avoid a cascading
  // render: reacts to checkIn changes only, matching the previous behavior.
  const [prevCheckIn, setPrevCheckIn] = useState(checkIn);
  if (prevCheckIn !== checkIn) {
    setPrevCheckIn(checkIn);
    if (suggestion && lateRule?.enabled && !statusTouched && ['Present', 'Late', 'Half Day'].includes(status)) {
      setStatus(suggestion.status);
    }
  }

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
            <p className="text-xs text-gray-500">{record.date} · currently {record.status} · {formatWorkHours(record.workHours)}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setStatusTouched(true); }}
            options={ADMIN_STATUS_OPTIONS}
            required
          />
          <div className="rounded-lg border border-[#D6E4E8] bg-[#EAF2F4]/60 px-4 py-2.5 self-end">
            <p className="text-[11px] uppercase tracking-wide text-gray-500">Work Hours</p>
            <p className="text-sm font-bold text-[#17324D]">{previewHours}h <span className="font-normal text-gray-400">(auto)</span></p>
          </div>
          <Input label="Check In" type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          <Input label="Check Out" type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
          {suggestion && lateRule?.enabled && suggestion.minutesLate > 0 && (
            <p className="sm:col-span-2 text-xs leading-relaxed text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5">
              Late-arrival rule: {formatDuration(suggestion.minutesLate)} late → auto-marked{' '}
              <span className="font-semibold">{suggestion.status}</span>.
            </p>
          )}
          <div className="sm:col-span-2">
            <Input label="Notes" placeholder="Reason for correction (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-[#D6E4E8]">
          {onDelete ? (
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (window.confirm(`Delete attendance record for ${record.employeeName} on ${record.date}?`)) {
                  onDelete(record.id);
                  onClose();
                }
              }}
            >
              <Trash2 size={16} /> Delete
            </Button>
          ) : <div />}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="primary"><Pencil size={16} /> Save Changes</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
