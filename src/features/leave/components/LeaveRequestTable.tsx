'use client';

import { CheckCircle2, Eye, Pencil, Trash2, XCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/shared';
import type { LeaveRequest } from '@/types';

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
  if (requests.length === 0) {
    return (
      <EmptyState
        title="No leave requests"
        description={
          isEmployee ? 'You have no leave requests yet. Click "Request Leave" to submit one.' : 'No leave requests found.'
        }
      />
    );
  }

  // ---- Admin / HR view: proper table with ID, Name, Date, Reason + actions ----
  if (!isEmployee) {
    return (
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-[#17324D] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6E4E8]">
              {requests.map((leave) => (
                <tr key={leave.id} className="hover:bg-[#EAF2F4]/50">
                  <td className="px-6 py-4 text-sm font-medium text-[#263238] whitespace-nowrap" title={leave.employeeCode || leave.employeeId}>
                    {leave.employeeCode || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={leave.employeeName} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-[#263238]">{leave.employeeName}</p>
                        <p className="text-xs text-gray-500">{leave.leaveType}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#263238] whitespace-nowrap">
                    {leave.startDate} to {leave.endDate}
                    <span className="block text-xs text-gray-500">{leave.days} day{leave.days > 1 ? 's' : ''} · Applied {leave.appliedOn}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-[260px] truncate" title={leave.reason}>
                    {leave.reason}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={leave.status} />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        title="View balances"
                        onClick={() => onViewBalances(leave)}
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        <Eye size={16} />
                      </button>
                      {leave.status === 'Pending' && (
                        <>
                          <button
                            title="Approve"
                            onClick={() => onApprove(leave)}
                            className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                          <button
                            title="Reject"
                            onClick={() => onReject(leave)}
                            className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map((leave) => (
        <div
          key={leave.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-blue-gray/50 border border-medium-gray gap-4"
        >
          <div className="flex items-center gap-3">
            <Avatar name={leave.employeeName} size="sm" />
            <div>
              <p className="text-sm font-medium text-[#263238]">{leave.employeeName}</p>
              <p className="text-xs text-gray-500">
                {leave.leaveType} · {leave.startDate} to {leave.endDate} · {leave.days} day{leave.days > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Reason: {leave.reason}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Applied on {leave.appliedOn}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={leave.status} />
            {leave.status === 'Pending' && (
              <div className="flex gap-2">
                <button
                  title="Edit"
                  onClick={() => onEdit(leave)}
                  className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                >
                  <Pencil size={18} />
                </button>
                <button
                  title="Delete"
                  onClick={() => onDelete(leave)}
                  className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
