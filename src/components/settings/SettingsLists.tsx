'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Clock, MapPin, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import EmptyState from '../ui/EmptyState';
import Input from '../ui/Input';
import Select from '../ui/Select';
import SettingsSection from './SettingsSection';
import {
  createBranch,
  createDepartment,
  createLeaveType,
  createShift,
  deleteBranch,
  deleteDepartment,
  deleteLeaveType,
  deleteShift,
  getBranches,
  getDepartments,
  getLeaveTypes,
  getShifts,
} from '@/lib/actions/settings';

function SkeletonRows() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-[#EAF2F4]" />
      ))}
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">{message}</p>;
}

function AddFormShell({ children, onCancel, onSave, saving, saveLabel }: {
  children: React.ReactNode;
  onCancel: () => void;
  onSave: (e: React.FormEvent) => void;
  saving: boolean;
  saveLabel: string;
}) {
  return (
    <form onSubmit={onSave} className="mb-4 rounded-lg border border-dashed border-[#D6E4E8] bg-[#F8FBFC] p-4 space-y-3">
      {children}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="submit" size="sm" disabled={saving}>{saving ? 'Saving…' : saveLabel}</Button>
      </div>
    </form>
  );
}

/* ================= Departments (DB) ================= */

export function DepartmentList() {
  const [items, setItems] = useState<{ id: string; name: string; head: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [head, setHead] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getDepartments();
      setItems(data.map((d) => ({ id: d.id, name: d.name, head: d.head || '' })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Department name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createDepartment(name.trim(), head.trim() || undefined);
      setName('');
      setHead('');
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add department.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await deleteDepartment(deleting.id);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete department.');
      setDeleting(null);
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <>
      <SettingsSection title="Departments" addLabel="Add Department" onAdd={() => { setShowAdd((v) => !v); setError(''); }}>
        {showAdd && (
          <AddFormShell onCancel={() => setShowAdd(false)} onSave={handleSave} saving={saving} saveLabel="Add Department">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Department Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Engineering" />
              <Input label="Head (optional)" value={head} onChange={(e) => setHead(e.target.value)} placeholder="e.g. Alex Johnson" />
            </div>
          </AddFormShell>
        )}
        {error && <ErrorBox message={error} />}
        {loading ? <SkeletonRows /> : items.length === 0 ? (
          <EmptyState title="No departments" description="Departments you add here are stored in the database and used across the system." />
        ) : items.map((dept) => (
          <div key={dept.id} className="flex items-center justify-between p-3 rounded-lg border border-[#D6E4E8] hover:bg-[#EAF2F4]/50">
            <div className="flex items-center gap-3">
              <Building2 size={16} className="text-[#024fa7]" />
              <div>
                <span className="text-sm font-medium text-[#263238]">{dept.name}</span>
                {dept.head && <p className="text-xs text-gray-500">Head: {dept.head}</p>}
              </div>
            </div>
            <button onClick={() => setDeleting({ id: dept.id, name: dept.name })} title="Delete department" className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"><Trash2 size={14} /></button>
          </div>
        ))}
      </SettingsSection>
      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Department?"
        variant="delete"
        headline={<>Delete <span className="font-semibold text-[#17324D]">{deleting?.name}</span>?</>}
        note={<>This action <span className="font-semibold">cannot be undone</span>. Employees linked to this department will keep their records.</>}
        confirmLabel="Delete"
        confirmIcon={<Trash2 size={16} />}
        onConfirm={handleDelete}
        loading={deletingBusy}
      />
    </>
  );
}

/* ================= Branches (DB) ================= */

export function BranchList() {
  const [items, setItems] = useState<{ id: string; name: string; city: string; address: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getBranches();
      setItems(data.map((b) => ({ id: b.id, name: b.name, city: b.city || '', address: b.address || '' })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load branches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Branch name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createBranch({ name, city, address });
      setName('');
      setCity('');
      setAddress('');
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add branch.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await deleteBranch(deleting.id);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete branch.');
      setDeleting(null);
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <>
      <SettingsSection title="Branches" addLabel="Add Branch" onAdd={() => { setShowAdd((v) => !v); setError(''); }}>
        {showAdd && (
          <AddFormShell onCancel={() => setShowAdd(false)} onSave={handleSave} saving={saving} saveLabel="Add Branch">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Branch Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Main Branch" />
              <Input label="City (optional)" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Gujranwala" />
              <div className="sm:col-span-2">
                <Input label="Address (optional)" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Branch address" />
              </div>
            </div>
          </AddFormShell>
        )}
        {error && <ErrorBox message={error} />}
        {loading ? <SkeletonRows /> : items.length === 0 ? (
          <EmptyState title="No branches" description="Branches you add here are stored in the database and used across the system." />
        ) : items.map((branch) => (
          <div key={branch.id} className="flex items-center justify-between p-3 rounded-lg border border-[#D6E4E8]">
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-[#024fa7]" />
              <div>
                <p className="text-sm font-medium text-[#263238]">{branch.name}</p>
                {(branch.city || branch.address) && <p className="text-xs text-gray-500">{[branch.city, branch.address].filter(Boolean).join(' · ')}</p>}
              </div>
            </div>
            <button onClick={() => setDeleting({ id: branch.id, name: branch.name })} title="Delete branch" className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"><Trash2 size={14} /></button>
          </div>
        ))}
      </SettingsSection>
      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Branch?"
        variant="delete"
        headline={<>Delete <span className="font-semibold text-[#17324D]">{deleting?.name}</span>?</>}
        note={<>This action <span className="font-semibold">cannot be undone</span>.</>}
        confirmLabel="Delete"
        confirmIcon={<Trash2 size={16} />}
        onConfirm={handleDelete}
        loading={deletingBusy}
      />
    </>
  );
}

/* ================= Shifts (DB) ================= */

export function ShiftList() {
  const [items, setItems] = useState<{ id: string; name: string; startTime: string; endTime: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getShifts();
      setItems(data.map((s) => ({ id: s.id, name: s.name, startTime: s.startTime || '', endTime: s.endTime || '' })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shifts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Shift name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createShift({ name, startTime, endTime });
      setName('');
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add shift.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await deleteShift(deleting.id);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete shift.');
      setDeleting(null);
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <>
      <SettingsSection title="Work Shifts" addLabel="Add Shift" onAdd={() => { setShowAdd((v) => !v); setError(''); }}>
        {showAdd && (
          <AddFormShell onCancel={() => setShowAdd(false)} onSave={handleSave} saving={saving} saveLabel="Add Shift">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Shift Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Morning Shift" />
              <Input label="Start Time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <Input label="End Time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </AddFormShell>
        )}
        {error && <ErrorBox message={error} />}
        {loading ? <SkeletonRows /> : items.length === 0 ? (
          <EmptyState title="No shifts" description="Shifts you add here are stored in the database and used across the system." />
        ) : items.map((shift) => (
          <div key={shift.id} className="flex items-center justify-between p-3 rounded-lg border border-[#D6E4E8]">
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-[#024fa7]" />
              <div>
                <p className="text-sm font-medium text-[#263238]">{shift.name}</p>
                {(shift.startTime || shift.endTime) && <p className="text-xs text-gray-500">{shift.startTime} — {shift.endTime}</p>}
              </div>
            </div>
            <button onClick={() => setDeleting({ id: shift.id, name: shift.name })} title="Delete shift" className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"><Trash2 size={14} /></button>
          </div>
        ))}
      </SettingsSection>
      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Shift?"
        variant="delete"
        headline={<>Delete <span className="font-semibold text-[#17324D]">{deleting?.name}</span>?</>}
        note={<>This action <span className="font-semibold">cannot be undone</span>.</>}
        confirmLabel="Delete"
        confirmIcon={<Trash2 size={16} />}
        onConfirm={handleDelete}
        loading={deletingBusy}
      />
    </>
  );
}

/* ================= Leave Types (DB) ================= */

export function LeaveTypeList() {
  const [items, setItems] = useState<{ id: string; name: string; daysAllowed: number; period: string; carryForward: boolean; color: string; description: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [days, setDays] = useState('2');
  const [period, setPeriod] = useState('month');
  const [carryForward, setCarryForward] = useState(false);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<{ id: string; name: string } | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getLeaveTypes();
      setItems(data.map((lt) => ({
        id: lt.id,
        name: lt.name,
        daysAllowed: lt.daysAllowed,
        period: lt.period || 'year',
        carryForward: !!lt.carryForward,
        color: lt.color || '#024fa7',
        description: lt.description || '',
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leave types.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const daysNum = parseInt(days, 10);
    if (!name.trim()) {
      setError('Leave type name is required.');
      return;
    }
    if (!Number.isFinite(daysNum) || daysNum < 0) {
      setError('Days allowed must be 0 or more.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createLeaveType({
        name,
        daysAllowed: daysNum,
        period: (period === 'month' ? 'month' : 'year'),
        carryForward,
        description,
      });
      setName('');
      setDays('2');
      setPeriod('month');
      setCarryForward(false);
      setDescription('');
      setShowAdd(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add leave type.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      await deleteLeaveType(deleting.id);
      setDeleting(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete leave type.');
      setDeleting(null);
    } finally {
      setDeletingBusy(false);
    }
  };

  return (
    <>
      <SettingsSection title="Leave Types & Policies" addLabel="Add Leave Type" onAdd={() => { setShowAdd((v) => !v); setError(''); }}>
        {showAdd && (
          <AddFormShell onCancel={() => setShowAdd(false)} onSave={handleSave} saving={saving} saveLabel="Add Leave Type">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Leave Type Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sick Leave" />
              <Input label="Days Allowed" type="number" min="0" step="1" value={days} onChange={(e) => setDays(e.target.value)} />
              <Select
                label="Period"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                options={[
                  { value: 'month', label: 'Per Month (resets monthly)' },
                  { value: 'year', label: 'Per Year' },
                ]}
              />
              <div className="flex items-end pb-2.5">
                <label className="flex items-center gap-2 text-sm text-[#263238] cursor-pointer">
                  <input type="checkbox" checked={carryForward} onChange={(e) => setCarryForward(e.target.checked)} className="h-4 w-4 accent-[#024fa7]" />
                  Carry forward unused days
                </label>
              </div>
              <div className="sm:col-span-2">
                <Input label="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short policy note" />
              </div>
            </div>
          </AddFormShell>
        )}
        {error && <ErrorBox message={error} />}
        {loading ? <SkeletonRows /> : items.length === 0 ? (
          <EmptyState title="No leave types" description="Leave types you add here are stored in the database and used across the system." />
        ) : items.map((lt) => (
          <div key={lt.id} className="flex items-center justify-between p-3 rounded-lg border border-[#D6E4E8]">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lt.color }} />
              <div>
                <p className="text-sm font-medium text-[#263238]">
                  {lt.name}
                  {lt.period === 'month' && (
                    <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700">Monthly</span>
                  )}
                </p>
                <p className="text-xs text-gray-500">{lt.daysAllowed} days/{lt.period === 'month' ? 'month · resets monthly' : 'year'} · {lt.carryForward ? 'Carry forward' : 'No carry forward'}{lt.description ? ` · ${lt.description}` : ''}</p>
              </div>
            </div>
            <button onClick={() => setDeleting({ id: lt.id, name: lt.name })} title="Delete leave type" className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"><Trash2 size={14} /></button>
          </div>
        ))}
      </SettingsSection>
      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete Leave Type?"
        variant="delete"
        headline={<>Delete <span className="font-semibold text-[#17324D]">{deleting?.name}</span>?</>}
        note={<>This action <span className="font-semibold">cannot be undone</span>. Existing requests keep their history.</>}
        confirmLabel="Delete"
        confirmIcon={<Trash2 size={16} />}
        onConfirm={handleDelete}
        loading={deletingBusy}
      />
      <div className="mt-3 flex items-center gap-2">
        <Badge variant="default">Live from database</Badge>
        <p className="text-xs text-gray-500">Adds and deletes save to the database and apply system-wide immediately.</p>
      </div>
    </>
  );
}
