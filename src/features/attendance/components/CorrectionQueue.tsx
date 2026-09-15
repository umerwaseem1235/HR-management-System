'use client';

import { BadgeCheck, FileWarning, History, X } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import { StatusBadge } from '@/components/shared';
import type { CorrectionRequest } from '../types';

export default function CorrectionQueue({
  corrections,
  pendingCorrections,
  onApprove,
  onReject,
}: {
  corrections: CorrectionRequest[];
  pendingCorrections: CorrectionRequest[];
  onApprove: (req: CorrectionRequest) => void;
  onReject: (req: CorrectionRequest) => void;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileWarning size={18} className="text-yellow-600" />
            <h3 className="text-base font-semibold text-[#17324D]">Correction Requests</h3>
          </div>
          <Badge variant="warning">{pendingCorrections.length} Pending</Badge>
        </div>
        <div className="space-y-3">
          {pendingCorrections.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-10">No pending correction requests</p>
          ) : (
            pendingCorrections.map((req) => (
              <div key={req.id} className="rounded-lg border border-[#D6E4E8] bg-[#F8FBFC] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={req.employeeName} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-[#263238]">{req.employeeName}</p>
                      <p className="text-xs text-gray-500">{req.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <StatusBadge status={req.currentStatus} />
                    <span className="text-gray-400">→</span>
                    <StatusBadge status={req.requestedStatus} />
                  </div>
                </div>
                {(req.requestedCheckIn || req.requestedCheckOut) && (
                  <p className="text-xs text-gray-500 mt-2">
                    Requested: {req.requestedCheckIn ? `In ${req.requestedCheckIn}` : ''}{req.requestedCheckOut ? ` · Out ${req.requestedCheckOut}` : ''}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">{req.reason}</p>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button
                    onClick={() => onReject(req)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#D6E4E8] px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <X size={14} /> Reject
                  </button>
                  <button
                    onClick={() => onApprove(req)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    <BadgeCheck size={14} /> Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <History size={18} className="text-[#17324D]" />
            <h3 className="text-base font-semibold text-[#17324D]">Request History</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Change</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6E4E8]">
              {corrections.map((req) => (
                <tr key={req.id} className="hover:bg-[#EAF2F4]/50">
                  <td className="px-4 py-3 text-sm font-medium text-[#263238]">{req.employeeName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{req.date}</td>
                  <td className="px-4 py-3 text-sm text-[#263238]">{req.currentStatus} → {req.requestedStatus}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={req.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
