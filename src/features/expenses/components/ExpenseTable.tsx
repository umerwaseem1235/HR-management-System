'use client';

import { CheckCircle2, Eye, Pencil, Trash2, XCircle } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { StatusBadge } from '@/components/shared';
import type { ExpenseClaim } from '@/types';

interface ExpenseTableProps {
  expenses: ExpenseClaim[];
  isEmployee: boolean;
  onApprove: (exp: ExpenseClaim) => void;
  onReject: (exp: ExpenseClaim) => void;
  onDelete: (exp: ExpenseClaim) => void;
  onEdit: (exp: ExpenseClaim) => void;
  onViewReceipt: (exp: ExpenseClaim) => void;
}

export default function ExpenseTable({ expenses, isEmployee, onApprove, onReject, onDelete, onEdit, onViewReceipt }: ExpenseTableProps) {
  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
            {!isEmployee && <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee</th>}
            <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Category</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-[#D6E4E8]">
            {expenses.map(exp => (
              <tr key={exp.id} className="hover:bg-[#EAF2F4]/50">
                {!isEmployee && (
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar name={exp.employeeName} size="sm" /><div><p className="text-sm font-medium">{exp.employeeName}</p><p className="text-xs text-gray-500">{exp.description}</p></div></div></td>
                )}
                {isEmployee && (
                  <td className="px-6 py-4"><div><p className="text-sm font-medium">{exp.category}</p><p className="text-xs text-gray-500">{exp.description}</p></div></td>
                )}
                {!isEmployee && <td className="px-6 py-4 text-sm">{exp.category}</td>}
                <td className="px-6 py-4 text-sm font-semibold text-[#17324D]">PKR {exp.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{exp.date}</td>
                <td className="px-6 py-4"><StatusBadge status={exp.status} /></td>
                {!isEmployee && <td className="px-6 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {exp.status === 'Pending' && <>
                      <button title="Approve" onClick={() => onApprove(exp)} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200 cursor-pointer"><CheckCircle2 size={16} /></button>
                      <button title="Reject" onClick={() => onReject(exp)} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer"><XCircle size={16} /></button>
                    </>}
                    <button title="Delete" onClick={() => onDelete(exp)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"><Trash2 size={16} /></button>
                    <button
                      type="button"
                      title="View Receipt"
                      onClick={() => onViewReceipt(exp)}
                      className="p-1.5 rounded-lg bg-[#EAF2F4] text-[#0F8B8D] hover:bg-[#D6E4E8] cursor-pointer"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>}
                {isEmployee && <td className="px-6 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {exp.status === 'Pending' && (
                      <button title="Edit" onClick={() => onEdit(exp)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"><Pencil size={16} /></button>
                    )}
                    <button title="Delete" onClick={() => onDelete(exp)} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"><Trash2 size={16} /></button>
                    <button
                      type="button"
                      title="View Receipt"
                      onClick={() => onViewReceipt(exp)}
                      className="p-1.5 rounded-lg bg-[#EAF2F4] text-[#0F8B8D] hover:bg-[#D6E4E8] cursor-pointer"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>}
              </tr>
            ))}
          </tbody>
        </table>
        {expenses.length === 0 && (
          <EmptyState
            title="No expenses"
            description="You have no expense claims yet. Click “New Claim” to submit one."
          />
        )}
      </div>
    </Card>
  );
}
