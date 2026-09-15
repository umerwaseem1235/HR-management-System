'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import Select from '@/components/ui/Select';
import EmptyState from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/shared';
import { Eye, X, Check, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import type { RemoteRequest } from '@/types';
import { formatRange, PER_PAGE_OPTIONS } from '../hooks/useRemoteView';

interface RemoteRequestTableProps {
  paged: RemoteRequest[];
  filteredCount: number;
  isEmployee: boolean;
  safePage: number;
  perPage: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  search: string;
  statusFilter: string;
  fromFilter: string;
  toFilter: string;
  onView: (req: RemoteRequest) => void;
  onReview: (req: RemoteRequest, decision: 'Approved' | 'Rejected') => void;
  onCancel: (req: RemoteRequest) => void;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

export default function RemoteRequestTable({
  paged, filteredCount, isEmployee,
  safePage, perPage, totalPages, rangeStart, rangeEnd,
  search, statusFilter, fromFilter, toFilter,
  onView, onReview, onCancel, onPageChange, onPerPageChange,
}: RemoteRequestTableProps) {
  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px]">
          <thead>
            <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase w-12">#</th>
              {!isEmployee && <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee</th>}
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">From - To</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Reason</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Requested On</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-[#17324D] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D6E4E8]">
            {paged.map((req, idx) => (
              <tr key={req.id} className="hover:bg-[#EAF2F4]/50">
                <td className="px-6 py-4 text-sm text-gray-400">{(safePage - 1) * perPage + idx + 1}</td>
                {!isEmployee && (
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={req.employeeName} size="sm" />
                      <span className="text-sm font-medium text-[#263238] whitespace-nowrap">{req.employeeName}</span>
                    </div>
                  </td>
                )}
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-[#263238] whitespace-nowrap">{formatRange(req.fromDate, req.toDate)}</p>
                  <p className="text-xs text-gray-500">{req.days} day{req.days > 1 ? 's' : ''}</p>
                </td>
                <td className="px-6 py-4 max-w-[280px]">
                  <p className="text-sm text-[#263238] truncate" title={req.reason}>{req.reason}</p>
                  {req.workPlan && <p className="text-xs text-gray-500 truncate" title={req.workPlan}>{req.workPlan}</p>}
                </td>
                <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{req.requestedOn}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button title="View details" onClick={() => onView(req)} className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4] cursor-pointer">
                      <Eye size={16} />
                    </button>
                    {req.status === 'Pending' && (
                      <>
                        {!isEmployee && (
                          <>
                            <button title="Approve" onClick={() => onReview(req, 'Approved')} className="p-2 rounded-lg text-green-600 hover:bg-green-50 cursor-pointer">
                              <Check size={16} />
                            </button>
                            <button title="Reject" onClick={() => onReview(req, 'Rejected')} className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer">
                              <X size={16} />
                            </button>
                          </>
                        )}
                        <button
                          title="Cancel request"
                          onClick={() => onCancel(req)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-red-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCount === 0 && (
          <EmptyState
            icon={<Inbox size={32} className="text-gray-300" />}
            title="No remote requests found"
            description={search || statusFilter !== 'all' || fromFilter || toFilter ? 'Try adjusting your filters.' : 'Click “Request Remote” to submit your first remote work request.'}
          />
        )}
      </div>
      {/* Pagination footer */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-4 border-t border-[#D6E4E8]">
        <div className="flex items-center gap-2 text-sm text-gray-500 sm:ml-auto">
          <span className="whitespace-nowrap">Records per page:</span>
          <div className="w-24">
            <Select
              value={String(perPage)}
              onChange={(e) => onPerPageChange(Number(e.target.value))}
              options={PER_PAGE_OPTIONS}
            />
          </div>
        </div>
        <p className="text-sm text-gray-500 tabular-nums">{rangeStart} - {rangeEnd} of {filteredCount}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            disabled={safePage <= 1}
            title="Previous page"
            className="p-2 rounded-lg border border-[#D6E4E8] text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            disabled={safePage >= totalPages}
            title="Next page"
            className="p-2 rounded-lg border border-[#D6E4E8] text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}
