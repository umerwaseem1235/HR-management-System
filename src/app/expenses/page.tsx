'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';
import { useAuth } from '../../contexts/AuthContext';
import { useRequireAuth, AuthLoadingFallback } from '../../components/auth/RequireAuth';
import { useExpense } from '../../contexts/ExpenseContext';
import type { ExpenseClaim } from '../../lib/types';
import ExpenseStats from '../../components/expenses/ExpenseStats';
import ExpenseTable from '../../components/expenses/ExpenseTable';
import ClaimFormModal from '../../components/expenses/ClaimFormModal';
import ReceiptViewerModal from '../../components/expenses/ReceiptViewerModal';
import ExpenseConfirmModals from '../../components/expenses/ExpenseConfirmModals';

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
  const [viewingExp, setViewingExp] = useState<ExpenseClaim | null>(null);
  const [confirmApproveExp, setConfirmApproveExp] = useState<ExpenseClaim | null>(null);
  const [confirmRejectExp, setConfirmRejectExp] = useState<ExpenseClaim | null>(null);
  const [confirmDeleteExp, setConfirmDeleteExp] = useState<ExpenseClaim | null>(null);
  const [zoom, setZoom] = useState(1);

  const openReceipt = (exp: ExpenseClaim) => {
    setViewingExp(exp);
    setViewingReceipt(exp.receipt ?? null);
    setZoom(1);
  };

  const closeReceipt = () => {
    setViewingExp(null);
    setViewingReceipt(null);
    setZoom(1);
  };

  const zoomIn = () => setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100));
  const zoomOut = () => setZoom((z) => Math.max(0.25, Math.round((z - 0.25) * 100) / 100));

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

  useRequireAuth();
  if (!user) return <AuthLoadingFallback />;

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
          title={isEmployee ? 'My Expenses' : 'Expenses'}
          actions={
            isEmployee && <Button variant="primary" onClick={openNew}><Plus size={16} /> New Claim</Button>
          }
        />

        <ExpenseStats
          totalPending={totalPending}
          approvedCount={visibleExpenses.filter(e => e.status === 'Approved').length}
          reimbursedCount={visibleExpenses.filter(e => e.status === 'Reimbursed').length}
        />

        <ExpenseTable
          visibleExpenses={visibleExpenses}
          isEmployee={isEmployee}
          onApprove={(exp) => setConfirmApproveExp(exp)}
          onReject={(exp) => setConfirmRejectExp(exp)}
          onDelete={(exp) => setConfirmDeleteExp(exp)}
          onViewReceipt={openReceipt}
        />
      </div>

      <ClaimFormModal
        isOpen={showModal}
        editingId={editingId}
        category={category}
        amount={amount}
        date={date}
        description={description}
        errors={errors}
        submitting={submitting}
        receiptName={receiptName}
        fileKey={fileKey}
        onClose={() => { setShowModal(false); resetForm(); }}
        onSubmit={handleSubmit}
        onCategoryChange={setCategory}
        onAmountChange={setAmount}
        onDateChange={setDate}
        onDescriptionChange={setDescription}
        onFileChange={handleFileChange}
        onRemoveReceipt={() => { setReceiptData(''); setReceiptName(''); setFileKey((k) => k + 1); }}
        onCancel={() => { setShowModal(false); resetForm(); }}
      />

      <ReceiptViewerModal
        viewingExp={viewingExp}
        viewingReceipt={viewingReceipt}
        zoom={zoom}
        onClose={closeReceipt}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={() => setZoom(1)}
      />

      <ExpenseConfirmModals
        confirmApproveExp={confirmApproveExp}
        confirmRejectExp={confirmRejectExp}
        confirmDeleteExp={confirmDeleteExp}
        onCloseApprove={() => setConfirmApproveExp(null)}
        onCloseReject={() => setConfirmRejectExp(null)}
        onCloseDelete={() => setConfirmDeleteExp(null)}
        onConfirmApprove={() => { if (confirmApproveExp) { updateExpenseStatus(confirmApproveExp.id, 'Approved'); setConfirmApproveExp(null); } }}
        onConfirmReject={() => { if (confirmRejectExp) { updateExpenseStatus(confirmRejectExp.id, 'Rejected'); setConfirmRejectExp(null); } }}
        onConfirmDelete={() => { if (confirmDeleteExp) { deleteExpenseClaim(confirmDeleteExp.id); setConfirmDeleteExp(null); } }}
      />
    </DashboardLayout>
  );
}
