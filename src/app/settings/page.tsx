'use client';

import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import { Building2, MapPin, Clock, Trash2, Plus } from 'lucide-react';
import SettingsForm from '../../components/settings/SettingsForm';
import SettingsSection from '../../components/settings/SettingsSection';
import type { Branch, Department, LeaveType } from '../../lib/types';
import {
  getDepartments, createDepartment, deleteDepartment,
  getBranches, createBranch, deleteBranch,
  getShifts, createShift, deleteShift,
  getLeaveTypes, createLeaveType, deleteLeaveType,
} from '../../lib/actions/settings';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('company');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Add-form state per tab
  const [deptName, setDeptName] = useState('');
  const [deptHead, setDeptHead] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchCity, setBranchCity] = useState('');
  const [shiftName, setShiftName] = useState('');
  const [shiftStart, setShiftStart] = useState('09:00');
  const [shiftEnd, setShiftEnd] = useState('18:00');
  const [ltName, setLtName] = useState('');
  const [ltDays, setLtDays] = useState('10');
  const [ltPeriod, setLtPeriod] = useState('year');

  const tabs = [
    { id: 'company', label: 'Company' },
    { id: 'departments', label: 'Departments' },
    { id: 'branches', label: 'Branches' },
    { id: 'shifts', label: 'Shifts' },
    { id: 'leave', label: 'Leave Policies' },
  ];

  const refreshAll = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [d, b, s, l] = await Promise.all([
        getDepartments(),
        getBranches(),
        getShifts(),
        getLeaveTypes(),
      ]);
      setDepartments(d);
      setBranches(b);
      setShifts(s);
      setLeaveTypes(l);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const handleAddDepartment = async () => {
    if (!deptName.trim()) return;
    await createDepartment(deptName.trim(), deptHead.trim() || undefined);
    setDeptName('');
    setDeptHead('');
    setDepartments(await getDepartments());
  };

  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Delete department "${name}"? Employees linked to it will keep their records but lose the link.`)) return;
    await deleteDepartment(id);
    setDepartments(await getDepartments());
  };

  const handleAddBranch = async () => {
    if (!branchName.trim()) return;
    await createBranch({ name: branchName.trim(), city: branchCity.trim() || undefined });
    setBranchName('');
    setBranchCity('');
    setBranches(await getBranches());
  };

  const handleDeleteBranch = async (id: string, name: string) => {
    if (!confirm(`Delete branch "${name}"?`)) return;
    await deleteBranch(id);
    setBranches(await getBranches());
  };

  const handleAddShift = async () => {
    if (!shiftName.trim()) return;
    await createShift({ name: shiftName.trim(), startTime: shiftStart, endTime: shiftEnd });
    setShiftName('');
    setShifts(await getShifts());
  };

  const handleDeleteShift = async (id: string, name: string) => {
    if (!confirm(`Delete shift "${name}"?`)) return;
    await deleteShift(id);
    setShifts(await getShifts());
  };

  const handleAddLeaveType = async () => {
    if (!ltName.trim()) return;
    await createLeaveType({
      name: ltName.trim(),
      daysAllowed: Math.max(1, Number(ltDays) || 1),
      period: (ltPeriod === 'month' ? 'month' : 'year') as 'month' | 'year',
    });
    setLtName('');
    setLeaveTypes(await getLeaveTypes());
  };

  const handleDeleteLeaveType = async (id: string, name: string) => {
    if (!confirm(`Delete leave type "${name}"? Existing balances stay untouched.`)) return;
    await deleteLeaveType(id);
    setLeaveTypes(await getLeaveTypes());
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
        />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <Card padding="none">
          <div className="px-6 pt-4"><Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} /></div>
          <div className="p-6">
            {activeTab === 'company' && (
              <SettingsForm />
            )}
            {activeTab === 'departments' && (
              <SettingsSection title="Departments" addLabel="Add Department">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 rounded-lg border border-dashed border-[#D6E4E8] bg-[#F8FBFC] p-3">
                  <Input placeholder="Department name" value={deptName} onChange={(e) => setDeptName(e.target.value)} aria-label="Department name" />
                  <Input placeholder="Head (optional)" value={deptHead} onChange={(e) => setDeptHead(e.target.value)} aria-label="Department head" />
                  <Button size="sm" onClick={handleAddDepartment} disabled={!deptName.trim()}><Plus size={15} /> Add</Button>
                </div>
                {isLoading ? (
                  <p className="text-sm text-gray-500 py-6 text-center">Loading departments…</p>
                ) : departments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between p-3 rounded-lg border border-[#D6E4E8] hover:bg-[#EAF2F4]/50">
                    <div className="flex items-center gap-3">
                      <Building2 size={16} className="text-[#024fa7]" />
                      <div>
                        <span className="text-sm font-medium text-[#263238]">{dept.name}</span>
                        {dept.head && <p className="text-xs text-gray-500">Head: {dept.head}</p>}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteDepartment(dept.id, dept.name)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50" title={`Delete ${dept.name}`}><Trash2 size={14} /></button>
                  </div>
                ))}
              </SettingsSection>
            )}
            {activeTab === 'branches' && (
              <SettingsSection title="Branches" addLabel="Add Branch">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 rounded-lg border border-dashed border-[#D6E4E8] bg-[#F8FBFC] p-3">
                  <Input placeholder="Branch name" value={branchName} onChange={(e) => setBranchName(e.target.value)} aria-label="Branch name" />
                  <Input placeholder="City" value={branchCity} onChange={(e) => setBranchCity(e.target.value)} aria-label="Branch city" />
                  <Button size="sm" onClick={handleAddBranch} disabled={!branchName.trim()}><Plus size={15} /> Add</Button>
                </div>
                {isLoading ? (
                  <p className="text-sm text-gray-500 py-6 text-center">Loading branches…</p>
                ) : branches.map((branch) => (
                  <div key={branch.id} className="flex items-center justify-between p-3 rounded-lg border border-[#D6E4E8]">
                    <div className="flex items-center gap-3">
                      <MapPin size={16} className="text-[#024fa7]" />
                      <div><p className="text-sm font-medium text-[#263238]">{branch.name}</p><p className="text-xs text-gray-500">{branch.city}</p></div>
                    </div>
                    <button onClick={() => handleDeleteBranch(branch.id, branch.name)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50" title={`Delete ${branch.name}`}><Trash2 size={14} /></button>
                  </div>
                ))}
              </SettingsSection>
            )}
            {activeTab === 'shifts' && (
              <SettingsSection title="Work Shifts" addLabel="Add Shift">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 rounded-lg border border-dashed border-[#D6E4E8] bg-[#F8FBFC] p-3 items-end">
                  <Input placeholder="Shift name" value={shiftName} onChange={(e) => setShiftName(e.target.value)} aria-label="Shift name" />
                  <Input label="Start" type="time" value={shiftStart} onChange={(e) => setShiftStart(e.target.value)} aria-label="Start time" />
                  <Input label="End" type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} aria-label="End time" />
                  <Button size="sm" onClick={handleAddShift} disabled={!shiftName.trim()}><Plus size={15} /> Add</Button>
                </div>
                {isLoading ? (
                  <p className="text-sm text-gray-500 py-6 text-center">Loading shifts…</p>
                ) : shifts.map((shift) => (
                  <div key={shift.id} className="flex items-center justify-between p-3 rounded-lg border border-[#D6E4E8]">
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-[#024fa7]" />
                      <div><p className="text-sm font-medium text-[#263238]">{shift.name}</p><p className="text-xs text-gray-500">{shift.startTime} — {shift.endTime}</p></div>
                    </div>
                    <button onClick={() => handleDeleteShift(shift.id, shift.name)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50" title={`Delete ${shift.name}`}><Trash2 size={14} /></button>
                  </div>
                ))}
              </SettingsSection>
            )}
            {activeTab === 'leave' && (
              <SettingsSection title="Leave Types & Policies" addLabel="Add Leave Type">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 rounded-lg border border-dashed border-[#D6E4E8] bg-[#F8FBFC] p-3 items-end">
                  <Input placeholder="Leave type name" value={ltName} onChange={(e) => setLtName(e.target.value)} aria-label="Leave type name" />
                  <Input label="Days" type="number" min={1} value={ltDays} onChange={(e) => setLtDays(e.target.value)} aria-label="Days allowed" />
                  <Select label="Period" value={ltPeriod} onChange={(e) => setLtPeriod(e.target.value)} options={[{ value: 'year', label: 'Yearly' }, { value: 'month', label: 'Monthly' }]} aria-label="Period" />
                  <Button size="sm" onClick={handleAddLeaveType} disabled={!ltName.trim()}><Plus size={15} /> Add</Button>
                </div>
                {isLoading ? (
                  <p className="text-sm text-gray-500 py-6 text-center">Loading leave types…</p>
                ) : leaveTypes.map((lt) => (
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
                    <button onClick={() => handleDeleteLeaveType(lt.id, lt.name)} className="p-1.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50" title={`Delete ${lt.name}`}><Trash2 size={14} /></button>
                  </div>
                ))}
              </SettingsSection>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
