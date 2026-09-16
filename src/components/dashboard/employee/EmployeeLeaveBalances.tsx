'use client';

import Link from 'next/link';
import { AlertCircle, Send } from 'lucide-react';
import Card from '../../ui/Card';
import Badge from '../../ui/Badge';
import Button from '../../ui/Button';
import type { LeaveBalance } from '../dashboard-types';

export default function EmployeeLeaveBalances({ balances }: { balances: LeaveBalance[] }) {
  return (
    <Card className="flex flex-col h-full">
      <h3 className="text-base font-semibold text-[#17324D] mb-4">Leave Balances</h3>
      <div className="grid grid-cols-1 gap-4 flex-1 content-start">
        {balances.map(balance => {
          const isMonthly = balance.leaveType === 'Monthly Leave';
          return (
            <div key={balance.leaveType} className="p-4 rounded-lg bg-[#EAF2F4]/50 border border-[#D6E4E8]">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-[#263238]">{balance.leaveType}</span>
                <Badge variant={balance.remaining > 5 ? 'success' : balance.remaining > 0 ? 'warning' : 'danger'} size="sm">
                  {balance.remaining} left
                </Badge>
              </div>
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {isMonthly ? '2 days / month · resets monthly' : `${balance.total} days / year`}
              </p>
              <div className="w-full bg-[#D6E4E8] rounded-full h-2 mb-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${balance.total > 0 ? Math.min(100, (balance.used / balance.total) * 100) : 0}%`, backgroundColor: '#024fa7' }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Used: {balance.used}</span>
                <span>Total: {balance.total}</span>
              </div>
              {balance.pending > 0 && (
                <p className="text-xs text-orange-500 mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {balance.pending} pending approval
                </p>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-auto pt-4 flex justify-end">
        <Link href="/leave">
          <Button variant="outline" size="sm">
            <Send size={14} /> Request Leave
          </Button>
        </Link>
      </div>
    </Card>
  );
}
