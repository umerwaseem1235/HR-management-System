'use client';

import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Select from '../ui/Select';
import EmptyState from '../ui/EmptyState';
import { Eye, X, Check, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import type { RemoteRequest, Employee } from '../../lib/types';
import { formatRange, StatusBadge, PER_PAGE_OPTIONS } from './remote-utils';

interface RemoteTableProps {
  isEmployee: boolean;
  paged: RemoteRequest[];
  safePage: number;
  perPage: number;
  filteredLength: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  search: string;
  statusFilter: string;
  fromFilter: string;
  toFilter: string;
  dateFilter: string;
  deptFilter: string;
  isSuperAdmin: boolean;
  empOf: (req: RemoteRequest) => Employee | undefined;
  deptOf: (req: RemoteRequest) => string;
  onView: (req: RemoteRequest) => void;
  onCancel: (req: RemoteRequest) => void;
  onReview: (req: RemoteRequest, decision: 'Approved' | 'Rejected') => void;
  onPerPageChange: (v: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export default function RemoteTable({
  isEmployee,
  paged,
  safePage,
  perPage,
  filteredLength,
  totalPages,
  rangeStart,
  rangeEnd,
  search,
  statusFilter,
  fromFilter,
  toFilter,
  dateFilter,
  deptFilter,
  isSuperAdmin,
  empOf,
  deptOf,
  onView,
  onCancel,
  onReview,
  onPerPageChange,
  onPrevPage,
  onNextPage,
}: RemoteTableProps) {
  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className={isEmployee ? "w-full min-w-[860px]" : "w-full min-w-[1080px]"}>
          <thead>
            {isEmployee ? (
              <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase w-12">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">From - To</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Requested On</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#17324D] uppercase">Actions</th>
              </tr>
            ) : (
              <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Remote Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Submitted Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#17324D] uppercase">Actions</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-[#D6E4E8]">
            {paged.map((req, idx) => {
              const emp = empOf(req);
              return isEmployee ? (
                <tr key={req.id} className="hover:bg-[#EAF2F4]/50">
                  <td className="px-6 py-4 text-sm text-gray-400">{(safePage - 1) * perPage + idx + 1}</td>
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
                        <button
                          title="Cancel request"
                          onClick={() => onCancel(req)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 hover:text-red-600 cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                <tr key={req.id} className="hover:bg-[#EAF2F4]/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={req.employeeName} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-[#263238] whitespace-nowrap">{req.employeeName}</p>
                        {emp && <p className="text-xs text-gray-500 whitespace-nowrap">{emp.designation}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{emp?.employeeCode ?? req.employeeId}</td>
                  <td className="px-6 py-4"><Badge variant="neutral">{deptOf(req)}</Badge></td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-[#263238] whitespace-nowrap">{formatRange(req.fromDate, req.toDate)}</p>
                    <p className="text-xs text-gray-500">{req.days} day{req.days > 1 ? 's' : ''}</p>
                  </td>
                  <td className="px-6 py-4 max-w-[260px]">
                    <p className="text-sm text-[#263238] truncate" title={req.reason}>{req.reason}</p>
                    {req.workPlan && <p className="text-xs text-gray-500 truncate" title={req.workPlan}>{req.workPlan}</p>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">{req.requestedOn}</td>
                  <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      <button title="View details" onClick={() => onView(req)} className="p-2 rounded-lg text-[#0F8B8D] hover:bg-[#EAF2F4] cursor-pointer">
                        <Eye size={16} />
                      </button>
                      {req.status === 'Pending' && (
                        <>
                          <button title="Approve" onClick={() => onReview(req, 'Approved')} className="p-2 rounded-lg text-green-600 hover:bg-green-50 cursor-pointer">
                            <Check size={16} />
                          </button>
                          <button title="Reject" onClick={() => onReview(req, 'Rejected')} className="p-2 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer">
                            <X size={16} />
                          </button>
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
              );
            })}
          </tbody>
        </table>
        {filteredLength === 0 && (
          <EmptyState
            icon={<Inbox size={32} className="text-gray-300" />}
            title="No remote requests found"
            description={search || statusFilter !== 'all' || fromFilter || toFilter || dateFilter || deptFilter !== 'all' ? 'Try adjusting your filters.' : isSuperAdmin ? 'No remote requests have been submitted yet.' : 'Click “Request Remote” to submit your first remote work request.'}
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
        <p className="text-sm text-gray-500 tabular-nums">{rangeStart} - {rangeEnd} of {filteredLength}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevPage}
            disabled={safePage <= 1}
            title="Previous page"
            className="p-2 rounded-lg border border-[#D6E4E8] text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={onNextPage}
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
