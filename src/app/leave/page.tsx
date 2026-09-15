"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import Tabs from "../../components/ui/Tabs";
import Button from "../../components/ui/Button";
import { Plus } from "lucide-react";
import { mockEmployees } from "../../lib/mock-data";
import { useAuth } from "../../contexts/AuthContext";
import { useRequireAuth, AuthLoadingFallback } from "../../components/auth/RequireAuth";
import { useLeave } from "../../contexts/LeaveContext";
import { LeaveRequest, LeaveBalance } from "../../lib/types";
import RequestList from "../../components/leave/RequestList";
import BalanceGrid from "../../components/leave/BalanceGrid";
import {
  EditLeaveModal,
  EditBalanceModal,
  BalanceDetailModal,
} from "../../components/leave/LeaveModals";
import { diffInDaysInclusive } from "../../components/leave/leave-utils";

export default function LeavePage() {
  const { user } = useAuth();
  const {
    leaveRequests,
    leaveBalances,
    updateLeaveStatus,
    updateLeaveRequest,
    deleteLeaveRequest,
    updateLeaveBalance,
  } = useLeave();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("requests");
  const isEmployee = user?.role === "employee";
  const isSuperAdmin = user?.role === "super_admin";

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");
  const [editReason, setEditReason] = useState("");
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [balanceRequest, setBalanceRequest] = useState<LeaveRequest | null>(
    null,
  );

  const [balanceType, setBalanceType] = useState("");
  const [balanceTotal, setBalanceTotal] = useState("");
  const [balanceErrors, setBalanceErrors] = useState<Record<string, string>>(
    {},
  );

  // Resolve the logged-in user to an employee record (same matching as profile page)
  const employee = useMemo(() => {
    if (!user) return undefined;
    return (
      mockEmployees.find(
        (e) => e.email.toLowerCase() === user.email.toLowerCase(),
      ) ||
      mockEmployees.find(
        (e) =>
          `${e.firstName} ${e.lastName}`.toLowerCase() ===
          user.name.toLowerCase(),
      )
    );
  }, [user]);

  // Employees only see their own leave records; admins/HR see everything
  const visibleRequests = useMemo(() => {
    if (!isEmployee) return leaveRequests;
    if (!user) return [];
    return leaveRequests.filter((l) =>
      employee
        ? l.employeeId === employee.id
        : l.employeeName.toLowerCase() === user.name.toLowerCase(),
    );
  }, [leaveRequests, isEmployee, employee, user]);

  // Statutory leaves (Maternity/Paternity) are handled separately —
  // the balances tab shows only the everyday quotas.
  const visibleBalances = useMemo(
    () =>
      leaveBalances.filter(
        (b) => b.leaveType === "Monthly Leave" || b.leaveType === "Annual Leave",
      ),
    [leaveBalances],
  );

  useRequireAuth();
  if (!user) return <AuthLoadingFallback />;

  const tabs = [
    {
      id: "requests",
      label: isEmployee ? "My Requests" : "Leave Requests",
      count: visibleRequests.filter((l) => l.status === "Pending").length,
    },
    { id: "balances", label: "Leave Balances" },
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
    setEditType("");
    setEditStart("");
    setEditEnd("");
    setEditReason("");
    setEditErrors({});
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!editType) nextErrors.editType = "Please select a leave type.";
    if (!editStart) nextErrors.editStart = "Start date is required.";
    if (!editEnd) nextErrors.editEnd = "End date is required.";
    if (editStart && editEnd && new Date(editEnd) < new Date(editStart)) {
      nextErrors.editEnd = "End date cannot be before start date.";
    }
    if (!editReason.trim())
      nextErrors.editReason = "Please enter a reason for your leave.";
    const days = diffInDaysInclusive(editStart, editEnd);
    setEditErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || days === null || !editingId)
      return;

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
    setBalanceType("");
    setBalanceTotal("");
    setBalanceErrors({});
  };

  const handleBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    const total = parseInt(balanceTotal, 10);
    const current = leaveBalances.find((b) => b.leaveType === balanceType);
    if (!balanceTotal) nextErrors.balanceTotal = "Total days is required.";
    else if (isNaN(total) || total < 0)
      nextErrors.balanceTotal = "Enter a valid number of days (0 or more).";
    else if (current && total < current.used)
      nextErrors.balanceTotal = `Total cannot be less than already used days (${current.used}).`;
    setBalanceErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !balanceType || !current) return;

    updateLeaveBalance(balanceType, total, current.used);
    closeBalanceModal();
  };

  const handleApprove = (id: string) => {
    updateLeaveStatus(id, "Approved", user.name);
  };

  const handleReject = (id: string) => {
    updateLeaveStatus(id, "Rejected", user.name);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Delete this leave request?"))
      deleteLeaveRequest(id);
  };

  const handleSelectRequest = (leave: LeaveRequest) => {
    setBalanceRequest(leave);
  };

  const handleOpenBalanceEdit = (bal: LeaveBalance) => {
    setBalanceType(bal.leaveType);
    setBalanceTotal(String(bal.total));
    setBalanceErrors({});
    setShowBalanceModal(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title={isEmployee ? "My Leave" : "Leave Management"}
          actions={
            user.role !== "super_admin" ? (
              <Button
                variant="primary"
                onClick={() => router.push("/leave/request")}
              >
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
            {activeTab === "requests" && (
              <RequestList
                requests={visibleRequests}
                isEmployee={isEmployee}
                onApprove={handleApprove}
                onReject={handleReject}
                onEdit={openEdit}
                onDelete={handleDelete}
                onSelect={handleSelectRequest}
              />
            )}
            {activeTab === "balances" && (
              <BalanceGrid
                balances={visibleBalances}
                isSuperAdmin={isSuperAdmin}
                onEditBalance={handleOpenBalanceEdit}
              />
            )}
          </div>
        </Card>
      </div>

      <EditLeaveModal
        isOpen={showEditModal}
        editType={editType}
        editStart={editStart}
        editEnd={editEnd}
        editReason={editReason}
        errors={editErrors}
        onEditTypeChange={setEditType}
        onEditStartChange={setEditStart}
        onEditEndChange={setEditEnd}
        onEditReasonChange={setEditReason}
        onClose={closeEdit}
        onSubmit={handleEditSubmit}
      />

      <EditBalanceModal
        isOpen={showBalanceModal}
        balanceType={balanceType}
        balanceTotal={balanceTotal}
        errors={balanceErrors}
        onBalanceTotalChange={setBalanceTotal}
        onClose={closeBalanceModal}
        onSubmit={handleBalanceSubmit}
      />

      <BalanceDetailModal
        balanceRequest={balanceRequest}
        balances={visibleBalances}
        onClose={() => setBalanceRequest(null)}
      />
    </DashboardLayout>
  );
}
