'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import { Plus, DollarSign, CheckCircle2, XCircle, Send, Trash2, Pencil, Paperclip, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';
import { EXPENSE_CATEGORIES } from '../../lib/constants';
import { useAuth } from '../../contexts/AuthContext';
import { useExpense } from '../../contexts/ExpenseContext';

export default function ExpensesPage() {
  const { user } = useAuth();
  const { expenses, addExpenseClaim, updateExpenseStatus, deleteExpenseClaim, updateExpenseClaim } = useExpense();
  const isEmployee = user?.role === 'employee';

  const [showModal, setShowModal] = useState(false);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState('');
  const [receiptName, setReceiptName] = useState('');
  const [fileKey, setFileKey] = useState(0);
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.5);

  const openReceipt = (receipt: string) => {
    setViewingReceipt(receipt);
    setZoom(0.5);
  };

  const closeReceipt = () => {
    setViewingReceipt(null);
    setZoom(0.5);
  };

  const zoomIn = () => setZoom((z) => Math.min(3, Math.round((z + 0.1) * 100) / 100));
  const zoomOut = () => setZoom((z) => Math.max(0.1, Math.round((z - 0.25) * 100) / 100));

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
    setReceiptData('');
    setReceiptName('');
    setFileKey((k) => k + 1);
    setErrors({});
    setSubmitting(false);
    setEditingId(null);
  };

  const openNew = () => {
    resetForm();
    setShowModal(true);
  };

  const openEdit = (exp: { id: string; category: string; amount: number; date: string; description: string; receipt?: string }) => {
    setEditingId(exp.id);
    setCategory(exp.category);
    setAmount(String(exp.amount));
    setDate(exp.date);
    setDescription(exp.description);
    setReceiptData(exp.receipt ?? '');
    setReceiptName(exp.receipt ? 'Attached receipt' : '');
    setErrors({});
    setShowModal(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setReceiptData('');
      setReceiptName('');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, receipt: 'File must be smaller than 2MB.' }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.receipt;
      return next;
    });
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptData(reader.result as string);
      setReceiptName(file.name);
    };
    reader.readAsDataURL(file);
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
    if (editingId) {
      updateExpenseClaim(editingId, {
        category,
        amount: Math.round(parsedAmount * 100) / 100,
        date,
        description: description.trim(),
        receipt: receiptData || undefined,
      });
    } else {
      addExpenseClaim({
        employeeId: employee?.id ?? user.id,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : user.name,
        category,
        amount: Math.round(parsedAmount * 100) / 100,
        date,
        description: description.trim(),
        receipt: receiptData || undefined,
      });
    }
    setShowModal(false);
    resetForm();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Finance"
          title={isEmployee ? 'My Expenses' : 'Expenses'}
          subtitle="Submit claims and track reimbursements"
          actions={
            isEmployee && <Button variant="primary" onClick={openNew}><Plus size={16} /> New Claim</Button>
          }
        />

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
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-[#D6E4E8]">
                {visibleExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-[#EAF2F4]/50">
                    {!isEmployee && (
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><Avatar name={exp.employeeName} size="sm" /><div><p className="text-sm font-medium">{exp.employeeName}</p><p className="text-xs text-gray-500">{exp.description}</p>{exp.receipt && (<button type="button" onClick={() => openReceipt(exp.receipt!)} className="inline-flex items-center gap-1 text-xs text-[#0F8B8D] hover:underline mt-0.5"><Paperclip size={12} /> View receipt</button>)}</div></div></td>
                    )}
                    {isEmployee && (
                      <td className="px-6 py-4"><div><p className="text-sm font-medium">{exp.category}</p><p className="text-xs text-gray-500">{exp.description}</p>{exp.receipt && (<button type="button" onClick={() => openReceipt(exp.receipt!)} className="inline-flex items-center gap-1 text-xs text-[#0F8B8D] hover:underline mt-0.5"><Paperclip size={12} /> View receipt</button>)}</div></td>
                    )}
                    {!isEmployee && <td className="px-6 py-4 text-sm">{exp.category}</td>}
                    <td className="px-6 py-4 text-sm font-semibold text-[#17324D]">${exp.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{exp.date}</td>
                    <td className="px-6 py-4">{statusBadge(exp.status)}</td>
                    {!isEmployee && <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {exp.status === 'Pending' && <>
                          <button title="Approve" onClick={() => updateExpenseStatus(exp.id, 'Approved')} className="p-1.5 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"><CheckCircle2 size={16} /></button>
                          <button title="Reject" onClick={() => updateExpenseStatus(exp.id, 'Rejected')} className="p-1.5 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"><XCircle size={16} /></button>
                        </>}
                        <button title="Delete" onClick={() => { if (window.confirm('Delete this expense claim?')) deleteExpenseClaim(exp.id); }} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>}
                    {isEmployee && <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {exp.status === 'Pending' && (
                          <button title="Edit" onClick={() => openEdit(exp)} className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"><Pencil size={16} /></button>
                        )}
                        <button title="Delete" onClick={() => { if (window.confirm('Delete this expense claim?')) deleteExpenseClaim(exp.id); }} className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
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

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingId ? 'Edit Expense Claim' : 'New Expense Claim'}>
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
          <div>
            <label className="block text-sm font-medium text-[#263238] mb-1.5">Payslip / Receipt (optional)</label>
            <input
              key={fileKey}
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#EAF2F4] file:text-[#17324D] hover:file:bg-[#D6E4E8]"
            />
            {errors.receipt && <p className="mt-1 text-sm text-red-500">{errors.receipt}</p>}
            {receiptName && (
              <div className="mt-2 flex items-center gap-2 text-sm text-[#263238] bg-[#EAF2F4]/60 border border-[#D6E4E8] rounded-lg px-3 py-2">
                <Paperclip size={14} className="text-[#0F8B8D] flex-shrink-0" />
                <span className="truncate flex-1">{receiptName}</span>
                <button
                  type="button"
                  title="Remove file"
                  onClick={() => { setReceiptData(''); setReceiptName(''); setFileKey((k) => k + 1); }}
                  className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">Your claim will be submitted with <span className="font-medium">Pending</span> status until it is approved or rejected.</p>
          <div className="flex justify-end gap-3 pt-4 border-t border-[#D6E4E8]">
            <Button variant="outline" type="button" onClick={() => { setShowModal(false); resetForm(); }}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              <Send size={16} /> {submitting ? (editingId ? 'Saving...' : 'Submitting...') : (editingId ? 'Save Changes' : 'Submit Claim')}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewingReceipt} onClose={closeReceipt} title="Receipt" size="lg">
        <div className="flex items-center justify-center gap-2 mb-4">
          <button
            type="button"
            title="Zoom out"
            onClick={zoomOut}
            disabled={zoom <= 0.1}
            className="p-2 rounded-lg bg-[#EAF2F4] text-[#17324D] hover:bg-[#D6E4E8] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-sm font-medium text-[#263238] w-14 text-center">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            title="Zoom in"
            onClick={zoomIn}
            disabled={zoom >= 3}
            className="p-2 rounded-lg bg-[#EAF2F4] text-[#17324D] hover:bg-[#D6E4E8] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            title="Reset zoom"
            onClick={() => setZoom(0.5)}
            className="p-2 rounded-lg bg-[#EAF2F4] text-[#17324D] hover:bg-[#D6E4E8]"
          >
            <RotateCcw size={16} />
          </button>
        </div>
        <div className="overflow-auto max-h-[65vh] rounded-lg border border-[#D6E4E8] bg-[#EAF2F4]/40">
          {viewingReceipt?.startsWith('data:application/pdf') ? (
            <iframe
              src={viewingReceipt}
              title="Receipt"
              className="w-full h-[65vh] origin-top"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : viewingReceipt ? (
            <img
              src={viewingReceipt}
              alt="Expense receipt"
              className="block mx-auto max-w-none origin-top"
              style={{ transform: `scale(${zoom})` }}
            />
          ) : null}
        </div>
      </Modal>
    </DashboardLayout>
  );
}
