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
          <thead><tr className="bg-blue-gray border-b border-medium-gray">
            {!isEmployee && <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Employee</th>}
            <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Category</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Date</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-medium-gray">
            {expenses.map(exp => (
              <tr key={exp.id} className="hover:bg-blue-gray dark:hover:bg-white/10/50">
                {!isEmployee && (
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar name={exp.employeeName} size="sm" /><div><p className="text-sm font-medium">{exp.employeeName}</p><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{exp.description}</p></div></div></td>
                )}
                {isEmployee && (
                  <td className="px-6 py-4"><div><p className="text-sm font-medium">{exp.category}</p><p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{exp.description}</p></div></td>
                )}
                {!isEmployee && <td className="px-6 py-4 text-sm">{exp.category}</td>}
                <td className="px-6 py-4 text-sm font-semibold text-primary dark:text-blue-gray-light">PKR {exp.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{exp.date}</td>
                <td className="px-6 py-4"><StatusBadge status={exp.status} /></td>
                {!isEmployee && <td className="px-6 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {exp.status === 'Pending' && <>
                      <button title="Approve" onClick={() => onApprove(exp)} className="p-1.5 rounded-lg bg-green-100 dark:bg-green-950/40 text-green-600 dark:text-green-400 hover:bg-green-200 cursor-pointer"><CheckCircle2 size={16} /></button>
                      <button title="Reject" onClick={() => onReject(exp)} className="p-1.5 rounded-lg bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-200 cursor-pointer"><XCircle size={16} /></button>
                    </>}
                    <button title="Delete" onClick={() => onDelete(exp)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 hover:text-red-600 dark:text-red-400 cursor-pointer"><Trash2 size={16} /></button>
                    <button
                      type="button"
                      title="View Receipt"
                      onClick={() => onViewReceipt(exp)}
                      className="p-1.5 rounded-lg bg-blue-gray text-[#0F8B8D] hover:bg-medium-gray cursor-pointer"
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </td>}
                {isEmployee && <td className="px-6 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {exp.status === 'Pending' && (
                      <button title="Edit" onClick={() => onEdit(exp)} className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:bg-blue-950/40 cursor-pointer"><Pencil size={16} /></button>
                    )}
                    <button title="Delete" onClick={() => onDelete(exp)} className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 hover:text-red-600 dark:text-red-400 cursor-pointer"><Trash2 size={16} /></button>
                    <button
                      type="button"
                      title="View Receipt"
                      onClick={() => onViewReceipt(exp)}
                      className="p-1.5 rounded-lg bg-blue-gray text-[#0F8B8D] hover:bg-medium-gray cursor-pointer"
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
