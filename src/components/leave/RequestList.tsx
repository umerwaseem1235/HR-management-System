"use client";

import React from "react";
import Avatar from "../ui/Avatar";
import EmptyState from "../ui/EmptyState";
import { CheckCircle2, XCircle, Pencil, Trash2 } from "lucide-react";
import { StatusBadge } from "./leave-helpers";
import type { LeaveRequest } from "./types";

export interface RequestListProps {
  requests: LeaveRequest[];
  isEmployee: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (leave: LeaveRequest) => void;
  onDelete: (id: string) => void;
  onSelect: (leave: LeaveRequest) => void;
}

export interface LeaveRequestRowProps {
  leave: LeaveRequest;
  isEmployee: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onEdit: (leave: LeaveRequest) => void;
  onDelete: (id: string) => void;
  onSelect: (leave: LeaveRequest) => void;
}

export function LeaveRequestRow({
  leave,
  isEmployee,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onSelect,
}: LeaveRequestRowProps) {
  return (
    <div
      onClick={() => {
        if (!isEmployee) onSelect(leave);
      }}
      title={!isEmployee ? "View employee leave balances" : undefined}
      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-blue-gray/50 border border-medium-gray gap-4 ${!isEmployee ? "cursor-pointer hover:border-teal/40 hover:bg-blue-gray" : ""}`}
    >
      <div className="flex items-center gap-3">
        <Avatar name={leave.employeeName} size="sm" />
        <div>
          <p className="text-sm font-medium text-[#263238]">
            {leave.employeeName}
          </p>
          <p className="text-xs text-gray-500">
            {leave.leaveType} · {leave.startDate} to {leave.endDate} ·{" "}
            {leave.days} day{leave.days > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">Reason: {leave.reason}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            Applied on {leave.appliedOn}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={leave.status} />
        {!isEmployee && leave.status === "Pending" && (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              title="Approve"
              onClick={() => onApprove(leave.id)}
              className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"
            >
              <CheckCircle2 size={18} />
            </button>
            <button
              title="Reject"
              onClick={() => onReject(leave.id)}
              className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}
        {isEmployee && leave.status === "Pending" && (
          <div className="flex gap-2">
            <button
              title="Edit"
              onClick={() => onEdit(leave)}
              className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
            >
              <Pencil size={18} />
            </button>
            <button
              title="Delete"
              onClick={() => onDelete(leave.id)}
              className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RequestList({
  requests,
  isEmployee,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onSelect,
}: RequestListProps) {
  return (
    <div className="space-y-3">
      {requests.length === 0 ? (
        <EmptyState
          title="No leave requests"
          description={
            isEmployee
              ? 'You have no leave requests yet. Click "Request Leave" to submit one.'
              : "No leave requests found."
          }
        />
      ) : (
        requests.map((leave) => (
          <LeaveRequestRow
            key={leave.id}
            leave={leave}
            isEmployee={isEmployee}
            onApprove={onApprove}
            onReject={onReject}
            onEdit={onEdit}
            onDelete={onDelete}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  );
}
