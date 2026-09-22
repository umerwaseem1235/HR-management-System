'use client';

import { useState } from 'react';
import { BadgeCheck, FileWarning, History, X } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/shared';
import type { CorrectionHistoryEntry, CorrectionRequest } from '../types';

type HistoryTab = 'manual' | 'requests';

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function CorrectionQueue({
  corrections,
  pendingCorrections,
  correctionHistory,
  onApprove,
  onReject,
}: {
  corrections: CorrectionRequest[];
  pendingCorrections: CorrectionRequest[];
  correctionHistory: CorrectionHistoryEntry[];
  onApprove: (req: CorrectionRequest) => void;
  onReject: (req: CorrectionRequest) => void;
}) {
  const [historyTab, setHistoryTab] = useState<HistoryTab>('manual');
  const decidedRequests = corrections.filter((c) => c.status !== 'Pending');

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
            <h3 className="text-base font-semibold text-[#17324D]">Correction History</h3>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-[#EAF2F4] p-1">
            <button
              type="button"
              onClick={() => setHistoryTab('manual')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                historyTab === 'manual' ? 'bg-white text-[#17324D] shadow-sm' : 'text-gray-500 hover:text-[#17324D]'
              }`}
            >
              Manual ({correctionHistory.length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab('requests')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                historyTab === 'requests' ? 'bg-white text-[#17324D] shadow-sm' : 'text-gray-500 hover:text-[#17324D]'
              }`}
            >
              Requests ({decidedRequests.length})
            </button>
          </div>
        </div>

        {historyTab === 'manual' ? (
          correctionHistory.length === 0 ? (
            <div className="py-6">
              <EmptyState
                title="No manual corrections yet"
                description="When HR edits an employee's attendance, it will be logged here with who changed what."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Corrected By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Change</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D6E4E8]">
                  {correctionHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-[#EAF2F4]/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={entry.correctedBy} size="sm" />
                          <span className="text-sm font-medium text-[#263238]">{entry.correctedBy}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-[#263238]">{entry.employeeName}</p>
                        <p className="text-xs text-gray-500">{entry.date}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-500 line-through">{entry.previousValue}</p>
                        <p className="text-xs font-medium text-[#263238]">{entry.newValue}</p>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          entry.action === 'Manual Correction' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{formatTimestamp(entry.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : decidedRequests.length === 0 ? (
          <div className="py-6">
            <EmptyState
              title="No decided requests"
              description="Approved or rejected employee requests will appear here."
            />
          </div>
        ) : (
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
                {decidedRequests.map((req) => (
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
        )}
      </Card>
    </div>
  );
}