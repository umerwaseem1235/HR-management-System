'use client';

import { useState } from 'react';
import { BadgeCheck, FileWarning, History, X } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { EmployeeAvatar, EmployeeCell, StatusBadge } from '@/components/shared';
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
            <FileWarning size={18} className="text-yellow-600 dark:text-yellow-400" />
            <h3 className="text-base font-semibold text-primary dark:text-blue-gray-light">Correction Requests</h3>
          </div>
          <Badge variant="warning">{pendingCorrections.length} Pending</Badge>
        </div>
        <div className="space-y-3">
          {pendingCorrections.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm text-center py-10">No pending correction requests</p>
          ) : (
            pendingCorrections.map((req) => (
              <div key={req.id} className="rounded-lg border border-medium-gray bg-blue-gray-light p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <EmployeeAvatar name={req.employeeName} employeeId={req.employeeId} avatar={req.employeeAvatar} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-dark-text dark:text-gray-100">{req.employeeName}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{req.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm">
                    <StatusBadge status={req.currentStatus} />
                    <span className="text-gray-400 dark:text-gray-500">→</span>
                    <StatusBadge status={req.requestedStatus} />
                  </div>
                </div>
                {(req.requestedCheckIn || req.requestedCheckOut) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-2">
                    Requested: {req.requestedCheckIn ? `In ${req.requestedCheckIn}` : ''}{req.requestedCheckOut ? ` · Out ${req.requestedCheckOut}` : ''}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{req.reason}</p>
                <div className="flex items-center justify-end gap-2 mt-3">
                  <button
                    onClick={() => onReject(req)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-medium-gray px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 transition-colors"
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
            <History size={18} className="text-primary dark:text-blue-gray-light" />
            <h3 className="text-base font-semibold text-primary dark:text-blue-gray-light">Correction History</h3>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-blue-gray p-1">
            <button
              type="button"
              onClick={() => setHistoryTab('manual')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                historyTab === 'manual' ? 'bg-white dark:bg-[#1b263b] text-primary dark:text-blue-gray-light shadow-sm' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-primary dark:text-blue-gray-light'
              }`}
            >
              Manual ({correctionHistory.length})
            </button>
            <button
              type="button"
              onClick={() => setHistoryTab('requests')}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                historyTab === 'requests' ? 'bg-white dark:bg-[#1b263b] text-primary dark:text-blue-gray-light shadow-sm' : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-primary dark:text-blue-gray-light'
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
                  <tr className="bg-blue-gray border-b border-medium-gray">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Corrected By</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Change</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">When</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-medium-gray">
                  {correctionHistory.map((entry) => (
                    <tr key={entry.id} className="hover:bg-blue-gray dark:hover:bg-white/10/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <EmployeeAvatar name={entry.correctedBy} size="sm" />
                          <span className="text-sm font-medium text-dark-text dark:text-gray-100">{entry.correctedBy}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <EmployeeCell name={entry.employeeName} sub={entry.date} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 line-through">{entry.previousValue}</p>
                        <p className="text-xs font-medium text-dark-text dark:text-gray-100">{entry.newValue}</p>
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          entry.action === 'Manual Correction' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400' : 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400'
                        }`}>
                          {entry.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 whitespace-nowrap">{formatTimestamp(entry.timestamp)}</td>
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
                <tr className="bg-blue-gray border-b border-medium-gray">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Change</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-medium-gray">
                {decidedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-blue-gray dark:hover:bg-white/10/50">
                    <td className="px-4 py-3"><EmployeeCell name={req.employeeName} employeeId={req.employeeId} avatar={req.employeeAvatar} /></td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{req.date}</td>
                    <td className="px-4 py-3 text-sm text-dark-text dark:text-gray-100">{req.currentStatus} → {req.requestedStatus}</td>
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