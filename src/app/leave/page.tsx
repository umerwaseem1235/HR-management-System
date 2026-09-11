'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Tabs from '../../components/ui/Tabs';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Plus, CheckCircle2, XCircle, Pencil, Trash2, Send } from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';
import { LEAVE_TYPES } from '../../lib/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useLeave } from '../../contexts/LeaveContext';
import { LeaveRequest } from '../../lib/types';

function diffInDaysInclusive(start: string, end: string): number | null {
  if (!start || !end) return null;
  const s = new Date(start);
  const e = new Date(end);
  if (isNaN(s.getTime()) || isNaN(e.getTime()) || e < s) return null;
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

export default function LeavePage() {
  const { user } = useAuth();
  const { leaveRequests, leaveBalances, updateLeaveStatus, updateLeaveRequest, deleteLeaveRequest, updateLeaveBalance } = useLeave();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('requests');
  const isEmployee = user?.role === 'employee';
  const isSuperAdmin = user?.role === 'super_admin';

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceType, setBalanceType] = useState('');
  const [balanceTotal, setBalanceTotal] = useState('');
  const [balanceUsed, setBalanceUsed] = useState('');
  const [balanceErrors, setBalanceErrors] = useState<Record<string, string>>({});

  // Resolve the logged-in user to an employee record (same matching as profile page)
  const employee = useMemo(() => {
    if (!user) return undefined;
    return (
      mockEmployees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
      mockEmployees.find((e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase())
    );
  }, [user]);

  // Employees only see their own leave records; admins/HR see everything
  const visibleRequests = useMemo(() => {
    if (!isEmployee) return leaveRequests;
    if (!user) return [];
    return leaveRequests.filter((l) =>
      employee ? l.employeeId === employee.id : l.employeeName.toLowerCase() === user.name.toLowerCase()
    );
  }, [leaveRequests, isEmployee, employee, user]);

  if (!user) return null;

  const tabs = [
    { id: 'requests', label: isEmployee ? 'My Requests' : 'Leave Requests', count: visibleRequests.filter(l => l.status === 'Pending').length },
    { id: 'balances', label: 'Leave Balances' },
  ];

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'neutral'> = {
      Pending: 'warning', Approved: 'success', Rejected: 'danger', Cancelled: 'neutral',
    };
    return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
  };

  const openEdit = (leave: LeaveRequest) => {
    setEditingId(leave.id);
    setEditType(leave.leaveType);
    setEditStart(leave.startDate);
    setEditEnd(leave.endDate);
    setEditReason(leave.reason);
    setEditErrors({});
    setShowEditModal(true);
  };

  const closeEdit = () => {
    setShowEditModal(false);
    setEditingId(null);
    setEditType('');
    setEditStart('');
    setEditEnd('');
    setEditReason('');
    setEditErrors({});
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!editType) nextErrors.editType = 'Please select a leave type.';
    if (!editStart) nextErrors.editStart = 'Start date is required.';
    if (!editEnd) nextErrors.editEnd = 'End date is required.';
    if (editStart && editEnd && new Date(editEnd) < new Date(editStart)) {
      nextErrors.editEnd = 'End date cannot be before start date.';
    }
    if (!editReason.trim()) nextErrors.editReason = 'Please enter a reason for your leave.';
    const days = diffInDaysInclusive(editStart, editEnd);
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || days === null || !editingId) return;

    updateLeaveRequest(editingId, {
      leaveType: editType,
      startDate: editStart,
      endDate: editEnd,
      days,
      reason: editReason.trim(),
    });
    closeEdit();
  };

  const closeBalanceModal = () => {
    setShowBalanceModal(false);
    setBalanceType('');
    setBalanceTotal('');
    setBalanceUsed('');
    setBalanceErrors({});
  };

  const handleBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    const total = parseInt(balanceTotal, 10);
    const used = parseInt(balanceUsed, 10);
    if (!balanceTotal) nextErrors.balanceTotal = 'Total days is required.';
    else if (isNaN(total) || total < 0) nextErrors.balanceTotal = 'Enter a valid number of days (0 or more).';
    if (!balanceUsed && balanceUsed !== '0') nextErrors.balanceUsed = 'Used days is required.';
    else if (isNaN(used) || used < 0) nextErrors.balanceUsed = 'Enter a valid number of days (0 or more).';
    else if (!isNaN(total) && used > total) nextErrors.balanceUsed = 'Used days cannot exceed total days.';
    setBalanceErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !balanceType) return;

    updateLeaveBalance(balanceType, total, used);
    closeBalanceModal();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Time Off"
          title={isEmployee ? 'My Leave' : 'Leave Management'}
          subtitle={isEmployee ? 'Request time off and track your leave balances' : 'Review leave requests and balances across the organization'}
          actions={
            user.role !== 'super_admin' ? (
              <Button variant="primary" onClick={() => router.push('/leave/request')}>
                <Plus size={16} /> Request Leave
              </Button>
            ) : undefined
          }
        />

        <Card padding="none">
          <div className="px-6 pt-4">
            <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
          </div>
          <div className="p-6">
            {activeTab === 'requests' && (
              <div className="space-y-3">
                {visibleRequests.length === 0 ? (
                  <EmptyState
                    title="No leave requests"
                    description={isEmployee ? 'You have no leave requests yet. Click "Request Leave" to submit one.' : 'No leave requests found.'}
                  />
                ) : (
                  visibleRequests.map(leave => (
                    <div key={leave.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8] gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={leave.employeeName} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-[#263238]">{leave.employeeName}</p>
                          <p className="text-xs text-gray-500">{leave.leaveType} · {leave.startDate} to {leave.endDate} · {leave.days} day{leave.days > 1 ? 's' : ''}</p>
                          <p className="text-xs text-gray-400 mt-0.5">Reason: {leave.reason}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">Applied on {leave.appliedOn}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {statusBadge(leave.status)}
                        {!isEmployee && leave.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button
                              title="Approve"
                              onClick={() => updateLeaveStatus(leave.id, 'Approved', user.name)}
                              className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button
                              title="Reject"
                              onClick={() => updateLeaveStatus(leave.id, 'Rejected', user.name)}
                              className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                            >
                              <XCircle size={18} />
                            </button>
                          </div>
                        )}
                        {isEmployee && leave.status === 'Pending' && (
                          <div className="flex gap-2">
                            <button
                              title="Edit"
                              onClick={() => openEdit(leave)}
                              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                            >
                              <Pencil size={18} />
                            </button>
                            <button
                              title="Delete"
                              onClick={() => { if (window.confirm('Delete this leave request?')) deleteLeaveRequest(leave.id); }}
                              className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            {activeTab === 'balances' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {leaveBalances.map(bal => (
                  <div key={bal.leaveType} className="p-4 rounded-lg border border-[#D6E4E8]">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-[#17324D]">{bal.leaveType}</h4>
                      {isSuperAdmin && (
                        <button
                          title="Edit balance"
                          onClick={() => {
                            setBalanceType(bal.leaveType);
                            setBalanceTotal(String(bal.total));
                            setBalanceUsed(String(bal.used));
                            setBalanceErrors({});
                            setShowBalanceModal(true);
                          }}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                    <div className="flex items-end gap-2 mb-3">
                      <span className="text-3xl font-bold text-[#0F8B8D]">{bal.remaining}</span>
                      <span className="text-sm text-gray-500 mb-1">/ {bal.total} days</span>
                    </div>
                    <div className="w-full bg-[#D6E4E8] rounded-full h-2 mb-2">
                      <div className="bg-[#0F8B8D] h-2 rounded-full" style={{ width: `${(bal.used / bal.total) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Used: {bal.used}</span>
                      <span>Remaining: {bal.remaining}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={showEditModal} onClose={closeEdit} title="Edit Leave Request">
        <form onSubmit={handleEditSubmit} className="space-y-5">
          <Select
            label="Leave Type"
            value={editType}
            onChange={(e) => setEditType(e.target.value)}
            error={editErrors.editType}
            options={[
              { value: '', label: 'Select Leave Type' },
              ...LEAVE_TYPES.map((lt) => ({ value: lt.name, label: lt.name })),
            ]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} error={editErrors.editStart} />
            <Input label="End Date" type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} error={editErrors.editEnd} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#263238] mb-1.5">Reason</label>
            <textarea
              rows={4}
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              placeholder="Enter reason for leave..."
              className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-[#263238] placeholder-gray-400 focus:ring-2 focus:outline-none ${editErrors.editReason ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#D6E4E8] focus:border-[#0F8B8D] focus:ring-[#0F8B8D]/20'}`}
            />
            {editErrors.editReason && <p className="mt-1 text-sm text-red-500">{editErrors.editReason}</p>}
          </div>
          <p className="text-xs text-gray-500">Your request will remain <span className="font-medium">Pending</span> until it is approved or rejected.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#D6E4E8]">
            <Button variant="outline" type="button" onClick={closeEdit}>Cancel</Button>
            <Button variant="primary" type="submit">
              <Send size={16} /> Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showBalanceModal} onClose={closeBalanceModal} title={`Edit Balance — ${balanceType}`}>
        <form
          onSubmit={handleBalanceSubmit}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Total Days" type="number" min="0" step="1" value={balanceTotal} onChange={(e) => setBalanceTotal(e.target.value)} error={balanceErrors.balanceTotal} />
            <Input label="Used Days" type="number" min="0" step="1" value={balanceUsed} onChange={(e) => setBalanceUsed(e.target.value)} error={balanceErrors.balanceUsed} />
          </div>
          <p className="text-xs text-gray-500">Remaining days are recalculated automatically (total − used).</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#D6E4E8]">
            <Button variant="outline" type="button" onClick={closeBalanceModal}>Cancel</Button>
            <Button variant="primary" type="submit">
              <Send size={16} /> Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
