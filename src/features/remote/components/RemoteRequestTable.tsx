'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { EmployeeCell, StatusBadge, TablePagination } from '@/components/shared';
import { Eye, X, Check, Inbox } from 'lucide-react';
import type { RemoteRequest } from '@/types';

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
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="bg-blue-gray border-b border-medium-gray">
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase w-12">#</th>
              {!isEmployee && <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Employee</th>}
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Requested On</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-medium-gray">
            {paged.map((req, idx) => (
              <tr key={req.id} className="hover:bg-blue-gray dark:hover:bg-white/10/50">
                <td className="px-6 py-4 text-sm text-gray-400 dark:text-gray-500">{(safePage - 1) * perPage + idx + 1}</td>
                {!isEmployee && (
                  <td className="px-6 py-4">
                    <EmployeeCell name={req.employeeName} employeeId={req.employeeId} avatar={req.employeeAvatar} />
                  </td>
                )}
                <td className="px-6 py-4"><StatusBadge status={req.status} /></td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 whitespace-nowrap">{req.requestedOn}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button title="View details" onClick={() => onView(req)} className="p-2 rounded-lg text-[#0F8B8D] hover:bg-blue-gray dark:hover:bg-white/10 cursor-pointer">
                      <Eye size={16} />
                    </button>
                    {req.status === 'Pending' && (
                      <>
                        {!isEmployee && (
                          <>
                            <button title="Approve" onClick={() => onReview(req, 'Approved')} className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:bg-green-950/30 cursor-pointer">
                              <Check size={16} />
                            </button>
                            <button title="Reject" onClick={() => onReview(req, 'Rejected')} className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 cursor-pointer">
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {isEmployee && (
                          <button
                            title="Cancel request"
                            onClick={() => onCancel(req)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 dark:bg-white/10 hover:text-red-600 dark:text-red-400 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
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
      {/* Pagination footer — hidden automatically when everything fits on one page */}
      <TablePagination
        page={safePage}
        totalPages={totalPages}
        totalCount={filteredCount}
        start={rangeStart}
        end={rangeEnd}
        perPage={perPage}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
      />
    </Card>
  );
}
