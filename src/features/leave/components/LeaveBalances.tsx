'use client';

import { Pencil } from 'lucide-react';
import { LEAVE_TYPES } from '@/lib/constants';
import type { LeaveBalance } from '@/types';

export default function LeaveBalances({
  balances,
  isSuperAdmin,
  onEditBalance,
}: {
  balances: LeaveBalance[];
  isSuperAdmin: boolean;
  onEditBalance: (balance: LeaveBalance) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-teal/20 bg-teal/5 px-4 py-3 text-xs leading-relaxed text-gray-600">
        <span className="font-semibold text-primary">Monthly Leave</span> gives{' '}
        <span className="font-semibold">2 paid days every calendar month</span> — it resets on the 1st and does not carry forward. Any
        approved days beyond the monthly quota are automatically treated as unpaid in payroll.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {balances.map((bal) => {
          const meta = LEAVE_TYPES.find((t) => t.name === bal.leaveType);
          const isMonthly = bal.leaveType === 'Monthly Leave';
          const pct = bal.total > 0 ? Math.min(100, (bal.used / bal.total) * 100) : 0;
          const unit = isMonthly ? 'days / month' : 'days / year';
          const accent = meta?.color ?? '#024fa7';
          return (
            <div
              key={bal.leaveType}
              className="card-hover relative rounded-xl border border-medium-gray bg-white p-5"
            >
              <div className="relative flex items-start justify-between gap-3">
                <h4 className="text-[15px] font-semibold tracking-tight text-primary">{bal.leaveType}</h4>
                {isSuperAdmin && (
                  <button
                    title="Edit balance"
                    onClick={() => onEditBalance(bal)}
                    className="rounded-lg bg-[#024fa7]/10 p-1.5 text-[#024fa7] transition-colors hover:bg-[#024fa7]/15"
                  >
                    <Pencil size={14} />
                  </button>
                )}
              </div>
              <div className="relative mt-1.5 flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    backgroundColor: `${accent}14`,
                    borderColor: `${accent}2E`,
                    color: accent,
                  }}
                >
                  {isMonthly ? 'Resets monthly' : meta?.carryForward ? 'Carry forward' : 'Annual quota'}
                </span>
                {bal.pending > 0 && (
                  <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700">
                    {bal.pending} pending
                  </span>
                )}
              </div>
              {isSuperAdmin ? (
                <div className="relative mt-4">
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-extrabold tracking-tight text-[#024fa7]">{bal.total}</span>
                    <span className="mb-1 text-sm text-gray-500">{unit}</span>
                  </div>
                  <p className="mt-1.5 text-xs text-gray-500">{meta?.description ?? 'Company leave quota'}</p>
                </div>
              ) : (
                <>
                  <div className="relative mt-4 flex items-end gap-2">
                    <span className="text-2xl font-extrabold tracking-tight text-[#024fa7]">{bal.remaining}</span>
                    <span className="mb-1 text-sm text-gray-500">
                      / {bal.total} {isMonthly ? 'days this month' : 'days'}
                    </span>
                  </div>
                  <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-[#EAF2F4]">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[#013a7c] via-[#024fa7] to-[#0265cc]"
                      style={{
                        width: `${pct}%`,
                      }}
                    />
                  </div>
                  <div className="relative mt-2.5 flex justify-between text-xs text-gray-500">
                    <span>Used: {bal.used}</span>
                    <span>Remaining: {bal.remaining}</span>
                  </div>
                  {isMonthly && <p className="mt-2 text-[11px] text-gray-500">Fresh quota every month · no carry forward</p>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
