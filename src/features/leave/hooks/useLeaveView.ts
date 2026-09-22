'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { mockEmployees } from '@/lib/mock-data';
import type { LeaveRequest } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useLeave } from '@/contexts/LeaveContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { getEmployeeUserId } from '@/lib/actions/notifications';
import { diffInDaysInclusive } from '../utils';

export function useLeaveView() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const {
    leaveRequests,
    leaveBalances,
    updateLeaveStatus,
    updateLeaveRequest,
    deleteLeaveRequest,
    updateLeaveBalance,
  } = useLeave();
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
  const [balanceRequest, setBalanceRequest] = useState<LeaveRequest | null>(null);

  const [balanceType, setBalanceType] = useState('');
  const [balanceTotal, setBalanceTotal] = useState('');
  const [balanceErrors, setBalanceErrors] = useState<Record<string, string>>({});

  const [confirmApproveLeave, setConfirmApproveLeave] = useState<LeaveRequest | null>(null);
  const [confirmRejectLeave, setConfirmRejectLeave] = useState<LeaveRequest | null>(null);
  const [confirmDeleteLeave, setConfirmDeleteLeave] = useState<LeaveRequest | null>(null);

  // Resolve the logged-in user to an employee record (same matching as profile page)
  const employee = useMemo(() => {
    if (!user) return undefined;
    return (
      mockEmployees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
      mockEmployees.find((e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase())
    );
  }, [user]);

  // Employees only see their own leave records; admins/HR see everything.
  // Prefer the real employee record linked to the login (real UUID from DB);
  // fall back to the legacy demo-data matching when no link exists.
  const visibleRequests = useMemo(() => {
    if (!isEmployee) return leaveRequests;
    if (!user) return [];
    if (user.employeeId) return leaveRequests.filter((l) => l.employeeId === user.employeeId);
    return leaveRequests.filter((l) =>
      employee ? l.employeeId === employee.id : l.employeeName.toLowerCase() === user.name.toLowerCase(),
    );
  }, [leaveRequests, isEmployee, employee, user]);

  // Statutory leaves (Maternity/Paternity) are handled separately —
  // the balances tab shows only the everyday quotas.
  const visibleBalances = useMemo(
    () => leaveBalances.filter((b) => b.leaveType === 'Monthly Leave' || b.leaveType === 'Annual Leave'),
    [leaveBalances],
  );

  const tabs = [
    {
      id: 'requests',
      label: isEmployee ? 'My Requests' : 'Leave Requests',
      count: visibleRequests.filter((l) => l.status === 'Pending').length,
    },
    { id: 'balances', label: 'Leave Balances' },
  ];

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
    setBalanceErrors({});
  };

  const handleBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    const total = parseInt(balanceTotal, 10);
    const current = leaveBalances.find((b) => b.leaveType === balanceType);
    if (!balanceTotal) nextErrors.balanceTotal = 'Total days is required.';
    else if (isNaN(total) || total < 0) nextErrors.balanceTotal = 'Enter a valid number of days (0 or more).';
    else if (current && total < current.used)
      nextErrors.balanceTotal = `Total cannot be less than already used days (${current.used}).`;
    setBalanceErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !balanceType || !current) return;

    updateLeaveBalance(balanceType, total, current.used);
    closeBalanceModal();
  };

  const goToRequestLeave = () => router.push('/leave/request');

  const notifyEmployeeOfDecision = async (leave: LeaveRequest, status: 'Approved' | 'Rejected', decidedBy: string) => {
    try {
      const employeeUserId = await getEmployeeUserId(leave.employeeId);
      if (!employeeUserId) return;
      await addNotification({
        userId: employeeUserId,
        title: `Leave ${status}`,
        message: `Your ${leave.leaveType} request (${leave.startDate} → ${leave.endDate}, ${leave.days} day${leave.days > 1 ? 's' : ''}) was ${status.toLowerCase()} by ${decidedBy}.`,
        type: status === 'Approved' ? 'success' : 'error',
        link: '/leave',
      });
    } catch {
      // Notification delivery failed silently — the decision itself is saved.
    }
  };

  const confirmApprove = async (leave: LeaveRequest, decidedBy: string) => {
    await updateLeaveStatus(leave.id, 'Approved', decidedBy);
    setConfirmApproveLeave(null);
    await notifyEmployeeOfDecision(leave, 'Approved', decidedBy);
  };

  const confirmReject = async (leave: LeaveRequest, decidedBy: string) => {
    await updateLeaveStatus(leave.id, 'Rejected', decidedBy);
    setConfirmRejectLeave(null);
    await notifyEmployeeOfDecision(leave, 'Rejected', decidedBy);
  };

  return {
    user,
    router,
    activeTab,
    setActiveTab,
    isEmployee,
    isSuperAdmin,
    tabs,
    employee,
    visibleRequests,
    visibleBalances,
    leaveBalances,
    updateLeaveStatus,
    deleteLeaveRequest,
    showEditModal,
    editingId,
    editType,
    setEditType,
    editStart,
    setEditStart,
    editEnd,
    setEditEnd,
    editReason,
    setEditReason,
    editErrors,
    showBalanceModal,
    setShowBalanceModal,
    balanceRequest,
    setBalanceRequest,
    balanceType,
    setBalanceType,
    balanceTotal,
    setBalanceTotal,
    balanceErrors,
    setBalanceErrors,
    confirmApproveLeave,
    setConfirmApproveLeave,
    confirmRejectLeave,
    setConfirmRejectLeave,
    confirmDeleteLeave,
    setConfirmDeleteLeave,
    openEdit,
    closeEdit,
    handleEditSubmit,
    confirmApprove,
    confirmReject,
    closeBalanceModal,
    handleBalanceSubmit,
    goToRequestLeave,
  };
}

export type UseLeaveViewReturn = ReturnType<typeof useLeaveView>;
