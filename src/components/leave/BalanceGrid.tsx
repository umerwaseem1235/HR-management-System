"use client";

import React from "react";
import { Pencil } from "lucide-react";
import { LEAVE_TYPES } from "../../lib/constants";
import type { LeaveBalance } from "./types";

export interface BalanceGridProps {
  balances: LeaveBalance[];
  isSuperAdmin: boolean;
  onEditBalance: (balance: LeaveBalance) => void;
}

export default function BalanceGrid({
  balances,
  isSuperAdmin,
  onEditBalance,
}: BalanceGridProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-teal/20 bg-teal/5 px-4 py-3 text-xs leading-relaxed text-gray-600">
        <span className="font-semibold text-primary">Monthly Leave</span> gives{" "}
        <span className="font-semibold">2 paid days every calendar month</span>{" "}
        — it resets on the 1st and does not carry forward. Any approved days
        beyond the monthly quota are automatically treated as unpaid in payroll.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {balances.map((bal) => {
          const meta = LEAVE_TYPES.find((t) => t.name === bal.leaveType);
          const isMonthly = bal.leaveType === "Monthly Leave";
          const pct =
            bal.total > 0 ? Math.min(100, (bal.used / bal.total) * 100) : 0;
          const unit = isMonthly ? "days / month" : "days / year";
          return (
            <div
              key={bal.leaveType}
              className="p-4 rounded-lg border border-medium-gray bg-white"
            >
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-semibold text-primary">
                  {bal.leaveType}
                </h4>
                {isSuperAdmin && (
                  <button
                    title="Edit balance"
                    onClick={() => onEditBalance(bal)}
                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                  style={{
                    backgroundColor: `${meta?.color ?? "#0d9488"}14`,
                    color: meta?.color ?? "#0d9488",
                  }}
                >
                  {isMonthly
                    ? "Resets monthly"
                    : meta?.carryForward
                      ? "Carry forward"
                      : "Annual quota"}
                </span>
                {bal.pending > 0 && (
                  <span className="text-[10px] font-medium text-amber-600">
                    {bal.pending} pending
                  </span>
                )}
              </div>
              {isSuperAdmin ? (
                <div>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-bold text-teal">
                      {bal.total}
                    </span>
                    <span className="text-sm text-gray-500 mb-1">{unit}</span>
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500">
                    {meta?.description ?? "Company leave quota"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-3xl font-bold text-teal">
                      {bal.remaining}
                    </span>
                    <span className="text-sm text-gray-500 mb-1">
                      / {bal.total} {isMonthly ? "days this month" : "days"}
                    </span>
                  </div>
                  <div className="w-full bg-medium-gray rounded-full h-2 mb-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: meta?.color ?? "#0d9488",
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Used: {bal.used}</span>
                    <span>Remaining: {bal.remaining}</span>
                  </div>
                  {isMonthly && (
                    <p className="mt-2 text-[11px] text-gray-500">
                      Fresh quota every month · no carry forward
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
