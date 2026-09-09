'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Plus, DollarSign, CheckCircle2, XCircle, Send } from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';
import { EXPENSE_CATEGORIES } from '../../lib/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useExpense } from '../../contexts/ExpenseContext';

export default function ExpensesPage() {
  const { user } = useAuth();
  const { expenses, addExpenseClaim, updateExpenseStatus } = useExpense();
  const isEmployee = user?.role === 'employee';

  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Resolve the logged-in user to an employee record (same matching as profile page)
  const employee = useMemo(() => {
    if (!user) return undefined;
    return (
      mockEmployees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
      mockEmployees.find((e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase())
    );
  }, [user]);

  // Employees only see their own expenses; admins/HR see everything
  const visibleExpenses = useMemo(() => {
    if (!isEmployee) return expenses;
    if (!user) return [];
    return expenses.filter((e) =>
      employee ? e.employeeId === employee.id : e.employeeName.toLowerCase() === user.name.toLowerCase()
    );
  }, [isEmployee, expenses, employee, user]);

  if (!user) return null;

  const statusBadge = (status: string) => {
    const map: Record<string, 'warning' | 'success' | 'danger' | 'info'> = {
      Pending: 'warning', Approved: 'success', Rejected: 'danger', Reimbursed: 'info',
    };
    return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
  };

  const totalPending = visibleExpenses.filter(e => e.status === 'Pending').reduce((s, e) => s + e.amount, 0);

  const resetForm = () => {
    setCategory('');
    setAmount('');
    setDate('');
    setDescription('');
    setErrors({});
    setSubmitting(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!category) nextErrors.category = 'Please select a category.';
    const parsedAmount = parseFloat(amount);
    if (!amount) nextErrors.amount = 'Amount is required.';
    else if (isNaN(parsedAmount) || parsedAmount <= 0) nextErrors.amount = 'Enter a valid amount greater than 0.';
    if (!date) nextErrors.date = 'Date is required.';
    if (!description.trim()) nextErrors.description = 'Please enter a description.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    addExpenseClaim({
      employeeId: employee?.id ?? user.id,
      employeeName: employee ? `${employee.firstName} ${employee.lastName}` : user.name,
      category,
      amount: Math.round(parsedAmount * 100) / 100,
      date,
      description: description.trim(),
    });
    setShowModal(false);
    resetForm();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#17324D]">{isEmployee ? 'My Expenses' : 'Expenses'}</h1>
          <Button variant="primary" onClick={() => setShowModal(true)}><Plus size={16} /> New Claim</Button>
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
              <div><p className="text-lg font-bold text-[#17324D]">{visibleExpenses.filter(e => e.status === 'Approved').length}</p><p className="text-xs text-gray-500">Approved</p></div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 p-2.5 rounded-lg"><DollarSign size={20} className="text-blue-600" /></div>
              <div><p className="text-lg font-bold text-[#17324D]">{visibleExpenses.filter(e => e.status === 'Reimbursed').length}</p><p className="text-xs text-gray-500">Reimbursed</p></div>
            </div>
          </Card>
        </div>

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                {!isEmployee && <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee</th>}
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
                {!isEmployee && <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Actions</th>}
              </tr></thead>
              <tbody className="divide-y divide-[#D6E4E8]">
                {visibleExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-[#EAF2F4]/50">
                    {!isEmployee && (
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar name={exp.employeeName} size="sm" /><div><p className="text-sm font-medium">{exp.employeeName}</p><p className="text-xs text-gray-500">{exp.description}</p></div></div></td>
                    )}
                    {isEmployee && (
                      <td className="px-6 py-4"><div><p className="text-sm font-medium">{exp.category}</p><p className="text-xs text-gray-500">{exp.description}</p></div></td>
                    )}
                    {!isEmployee && <td className="px-6 py-4 text-sm">{exp.category}</td>}
                    <td className="px-6 py-4 text-sm font-semibold text-[#17324D]">${exp.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{exp.date}</td>
                    <td className="px-6 py-4">{statusBadge(exp.status)}</td>
                    {!isEmployee && <td className="px-6 py-4">
                      {exp.status === 'Pending' && <div className="flex gap-2">
                        <button title="Approve" onClick={() => updateExpenseStatus(exp.id, 'Approved')} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"><CheckCircle2 size={16} /></button>
                        <button title="Reject" onClick={() => updateExpenseStatus(exp.id, 'Rejected')} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"><XCircle size={16} /></button>
                      </div>}
                    </td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleExpenses.length === 0 && (
              <EmptyState
                title="No expenses"
                description="You have no expense claims yet. Click “New Claim” to submit one."
              />
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title="New Expense Claim">
        <form onSubmit={handleSubmit} className="space-y-5">
          <Select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            error={errors.category}
            options={[{ value: '', label: 'Select Category' }, ...EXPENSE_CATEGORIES.map((c) => ({ value: c, label: c }))]}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Amount ($)" type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} error={errors.amount} />
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} error={errors.date} />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#263238] mb-1.5">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this expense for?"
              className={`w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-[#263238] placeholder-gray-400 focus:ring-2 focus:outline-none ${errors.description ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : 'border-[#D6E4E8] focus:border-[#0F8B8D] focus:ring-[#0F8B8D]/20'}`}
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
          </div>
          <p className="text-xs text-gray-500">Your claim will be submitted with <span className="font-medium">Pending</span> status until it is approved or rejected.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#D6E4E8]">
            <Button variant="outline" type="button" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              <Send size={16} /> {submitting ? 'Submitting...' : 'Submit Claim'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
