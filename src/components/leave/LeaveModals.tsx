"use client";

import React from "react";
import { Send } from "lucide-react";
import Modal from "../ui/Modal";
import Input from "../ui/Input";
import Select from "../ui/Select";
import Button from "../ui/Button";
import { LEAVE_TYPES } from "../../lib/constants";
import type { LeaveRequest, LeaveBalance, FormErrors } from "./types";

export interface EditLeaveModalProps {
  isOpen: boolean;
  editType: string;
  editStart: string;
  editEnd: string;
  editReason: string;
  errors: FormErrors;
  onEditTypeChange: (value: string) => void;
  onEditStartChange: (value: string) => void;
  onEditEndChange: (value: string) => void;
  onEditReasonChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditLeaveModal({
  isOpen,
  editType,
  editStart,
  editEnd,
  editReason,
  errors,
  onEditTypeChange,
  onEditStartChange,
  onEditEndChange,
  onEditReasonChange,
  onClose,
  onSubmit,
}: EditLeaveModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Leave Request">
      <form onSubmit={onSubmit} className="space-y-5">
        <Select
          label="Leave Type"
          value={editType}
          onChange={(e) => onEditTypeChange(e.target.value)}
          error={errors.editType}
          options={[
            { value: "", label: "Select Leave Type" },
            ...LEAVE_TYPES.map((lt) => ({ value: lt.name, label: lt.name })),
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={editStart}
            onChange={(e) => onEditStartChange(e.target.value)}
            error={errors.editStart}
          />
          <Input
            label="End Date"
            type="date"
            value={editEnd}
            onChange={(e) => onEditEndChange(e.target.value)}
            error={errors.editEnd}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#263238] mb-1.5">
            Reason
          </label>
          <textarea
            rows={4}
            value={editReason}
            onChange={(e) => onEditReasonChange(e.target.value)}
            placeholder="Enter reason for leave..."
            className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-[#263238] placeholder-gray-400 focus:ring-2 focus:outline-none ${errors.editReason ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : "border-medium-gray focus:border-teal focus:ring-teal/20"}`}
          />
          {errors.editReason && (
            <p className="mt-1 text-sm text-red-500">{errors.editReason}</p>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Your request will remain <span className="font-medium">Pending</span>{" "}
          until it is approved or rejected.
        </p>
        <div className="flex justify-end gap-3 pt-4 border-t border-medium-gray">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            <Send size={16} /> Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export interface EditBalanceModalProps {
  isOpen: boolean;
  balanceType: string;
  balanceTotal: string;
  errors: FormErrors;
  onBalanceTotalChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function EditBalanceModal({
  isOpen,
  balanceType,
  balanceTotal,
  errors,
  onBalanceTotalChange,
  onClose,
  onSubmit,
}: EditBalanceModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Balance — ${balanceType}`}
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <Input
          label="Total Days"
          type="number"
          min="0"
          step="1"
          value={balanceTotal}
          onChange={(e) => onBalanceTotalChange(e.target.value)}
          error={errors.balanceTotal}
        />
        <p className="text-xs text-gray-500">
          Remaining days are recalculated automatically (total − used).
        </p>
        <div className="flex justify-end gap-3 pt-4 border-t border-medium-gray">
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            <Send size={16} /> Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export interface BalanceDetailModalProps {
  balanceRequest: LeaveRequest | null;
  balances: LeaveBalance[];
  onClose: () => void;
}

export function BalanceDetailModal({
  balanceRequest,
  balances,
  onClose,
}: BalanceDetailModalProps) {
  return (
    <Modal
      isOpen={!!balanceRequest}
      onClose={onClose}
      title={
        balanceRequest
          ? `Leave Balances — ${balanceRequest.employeeName}`
          : "Leave Balances"
      }
    >
      {balanceRequest && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">
            Remaining balances for{" "}
            <span className="font-medium text-[#263238]">
              {balanceRequest.employeeName}
            </span>{" "}
            ({balanceRequest.leaveType} · {balanceRequest.startDate} to{" "}
            {balanceRequest.endDate})
          </p>
          {balances.map((bal) => (
            <div
              key={bal.leaveType}
              className="p-4 rounded-lg bg-blue-gray/50 border border-medium-gray"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[#263238]">
                  {bal.leaveType}
                </span>
                <span className="text-sm font-bold text-primary">
                  {bal.remaining}/{bal.total} remaining
                </span>
              </div>
              <div className="w-full bg-medium-gray rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal h-2 rounded-full"
                  style={{
                    width: `${bal.total > 0 ? Math.min(100, Math.max(0, (bal.used / bal.total) * 100)) : 0}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                <span>Used: {bal.used}</span>
                <span>Total: {bal.total}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
