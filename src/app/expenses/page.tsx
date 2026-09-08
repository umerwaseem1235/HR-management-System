'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { Plus, DollarSign, CheckCircle2, XCircle } from 'lucide-react';
import { mockExpenses } from '../../lib/mock-data';
import { useAuth } from '../../contexts/AuthContext';

export default function ExpensesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role !== 'employee';

  const statusBadge = (status: string) => {
    const map: Record<string, 'warning' | 'success' | 'danger' | 'info'> = {
      Pending: 'warning', Approved: 'success', Rejected: 'danger', Reimbursed: 'info',
    };
    return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
  };

  const totalPending = mockExpenses.filter(e => e.status === 'Pending').reduce((s, e) => s + e.amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#17324D]">Expenses</h1>
          <Button variant="primary"><Plus size={16} /> New Claim</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-50 p-2.5 rounded-lg"><DollarSign size={20} className="text-yellow-600" /></div>
              <div><p className="text-lg font-bold text-[#17324D]">${totalPending.toLocaleString()}</p><p className="text-xs text-gray-500">Pending Amount</p></div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2.5 rounded-lg"><CheckCircle2 size={20} className="text-green-600" /></div>
              <div><p className="text-lg font-bold text-[#17324D]">{mockExpenses.filter(e => e.status === 'Approved').length}</p><p className="text-xs text-gray-500">Approved</p></div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2.5 rounded-lg"><DollarSign size={20} className="text-blue-600" /></div>
              <div><p className="text-lg font-bold text-[#17324D]">{mockExpenses.filter(e => e.status === 'Reimbursed').length}</p><p className="text-xs text-gray-500">Reimbursed</p></div>
            </div>
          </Card>
        </div>

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
                {isAdmin && <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Actions</th>}
              </tr></thead>
              <tbody className="divide-y divide-[#D6E4E8]">
                {mockExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-[#EAF2F4]/50">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar name={exp.employeeName} size="sm" /><div><p className="text-sm font-medium">{exp.employeeName}</p><p className="text-xs text-gray-500">{exp.description}</p></div></div></td>
                    <td className="px-6 py-4 text-sm">{exp.category}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-[#17324D]">${exp.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{exp.date}</td>
                    <td className="px-6 py-4">{statusBadge(exp.status)}</td>
                    {isAdmin && <td className="px-6 py-4">
                      {exp.status === 'Pending' && <div className="flex gap-2">
                        <button className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"><CheckCircle2 size={16} /></button>
                        <button className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"><XCircle size={16} /></button>
                      </div>}
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
