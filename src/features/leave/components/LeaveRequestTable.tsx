'use client';

import React, { useEffect, useState } from 'react';
import { Check, Eye, Pencil, Trash2, X } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { EmployeeCell, StatusBadge, TablePagination } from '@/components/shared';
import { paginate } from '@/utils/pagination';
import type { LeaveRequest } from '@/types';

function employeeIdLabel(leave: LeaveRequest) {
  if (leave.employeeCode) return leave.employeeCode.toUpperCase();
  const clean = leave.employeeId.replace(/[^a-zA-Z0-9]/g, '');
  return `EMP-${(clean.slice(0, 3) || '001').toUpperCase()}`;
}

export default function LeaveRequestTable({
  requests,
  isEmployee,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  onViewBalances,
}: {
  requests: LeaveRequest[];
  isEmployee: boolean;
  onApprove: (leave: LeaveRequest) => void;
  onReject: (leave: LeaveRequest) => void;
  onEdit: (leave: LeaveRequest) => void;
  onDelete: (leave: LeaveRequest) => void;
  onViewBalances: (leave: LeaveRequest) => void;
}) {
  const pendingCount = requests.filter((r) => r.status === 'Pending').length;
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  useEffect(() => {
    setPage(1);
  }, [requests.length, isEmployee]);
  const { totalPages, safePage, start, end, rows } = paginate(requests, page, perPage);

  return (
    <Card padding="none">
      <div className="px-6 py-4 border-b border-medium-gray flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-primary dark:text-blue-gray-light">Leave Requests</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {requests.length} total request{requests.length === 1 ? '' : 's'}
            {pendingCount > 0 && ` · ${pendingCount} awaiting review`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default">{requests.length} total</Badge>
          {pendingCount > 0 && <Badge variant="warning">{pendingCount} pending</Badge>}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="p-6">
          <EmptyState
            title="No leave requests"
            description={
              isEmployee ? 'You have no leave requests yet. Click "Request Leave" to submit one.' : 'No leave requests found.'
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-blue-gray border-b border-medium-gray">
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-medium-gray">
              {rows.map((leave) => {
                const isPending = leave.status === 'Pending';
                return (
                  <tr
                    key={leave.id}
                    className="transition-colors hover:bg-blue-gray dark:hover:bg-white/10/50"
                  >
                    {/* ID - Employee ID like EMP001 */}
                    <td className="px-6 py-4 whitespace-nowrap" title={leave.employeeId}>
                      <span className="font-mono text-xs font-medium text-gray-500 dark:text-gray-400">{employeeIdLabel(leave)}</span>
                    </td>

                    {/* Name */}
                    <td className="px-6 py-4">
                      <EmployeeCell
                        name={leave.employeeName}
                        employeeId={leave.employeeId}
                        avatar={leave.employeeAvatar}
                        sub={[leave.leaveType, `${leave.days} day${leave.days > 1 ? 's' : ''}`]
                          .filter(Boolean)
                          .join(' · ')}
                      />
                    </td>

                    {/* Period */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-dark-text dark:text-gray-100">
                        {leave.startDate} <span className="text-gray-400">→</span> {leave.endDate}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Applied {leave.appliedOn}</p>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={leave.status} />
                    </td>

                    {/* Actions: Approve / Reject / View */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {!isEmployee && isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => onApprove(leave)}
                              title={`Approve leave for ${leave.employeeName}`}
                              aria-label={`Approve leave for ${leave.employeeName}`}
                              className="p-2 rounded-lg bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-950/60 transition-colors"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onReject(leave)}
                              title={`Reject leave for ${leave.employeeName}`}
                              aria-label={`Reject leave for ${leave.employeeName}`}
                              className="p-2 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-950/60 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        {isEmployee && isPending && (
                          <>
                            <button
                              type="button"
                              onClick={() => onEdit(leave)}
                              title="Edit request"
                              aria-label={`Edit leave request ${leave.leaveType}`}
                              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-teal hover:bg-blue-gray dark:hover:bg-white/10 transition-colors"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(leave)}
                              title="Withdraw request"
                              aria-label={`Withdraw leave request ${leave.leaveType}`}
                              className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => onViewBalances(leave)}
                          title={isEmployee ? `View request details` : `View ${leave.employeeName}'s leave balances`}
                          aria-label={`View leave request ${employeeIdLabel(leave)}`}
                          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:text-teal hover:bg-blue-gray dark:hover:bg-white/10 transition-colors"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <TablePagination
        page={safePage}
        totalPages={totalPages}
        totalCount={requests.length}
        start={start}
        end={end}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={(n) => {
          setPerPage(n);
          setPage(1);
        }}
      />
    </Card>
  );
}
