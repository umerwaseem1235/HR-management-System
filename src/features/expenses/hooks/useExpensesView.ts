'use client';

import { useMemo, useState } from 'react';
import { mockEmployees } from '@/lib/mock-data';
import { expenseReportToPDF } from '@/lib/expense-report';
import { downloadBlob } from '@/lib/payroll-pdf';
import { useAuth } from '@/contexts/AuthContext';
import { useExpense } from '@/contexts/ExpenseContext';
import type { ExpenseClaim } from '@/types';

export function useExpensesView() {
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
  const [expenseMonth, setExpenseMonth] = useState('all');
  const [zoom, setZoom] = useState(0.5);

  const openReceipt = (exp: ExpenseClaim) => {
    setViewingExp(exp);
    setViewingReceipt(exp.receipt ?? null);
    setZoom(0.5);
  };

  const closeReceipt = () => {
    setViewingExp(null);
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

  // Employees only see their own expenses; admins/HR see everything.
  // Admins can additionally narrow the view to a single calendar month.
  const visibleExpenses = useMemo(() => {
    if (!isEmployee) {
      if (user) {
        const list = expenses;
        if (expenseMonth === 'all') return list;
        return list.filter((e) => e.date.startsWith(expenseMonth));
      }
      return [];
    }
    if (!user) return [];
    return expenses.filter((e) =>
      employee ? e.employeeId === employee.id : e.employeeName.toLowerCase() === user.name.toLowerCase()
    );
  }, [isEmployee, expenses, employee, user, expenseMonth]);

  const expensePeriodLabel = useMemo(() => {
    if (expenseMonth === 'all') return 'All Months';
    const [y, m] = expenseMonth.split('-').map(Number);
    if (!y || !m) return 'All Months';
    return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [expenseMonth]);

  const handleExportPDF = () => {
    const slug = expenseMonth === 'all' ? 'all-months' : expenseMonth;
    downloadBlob(`expense-report-${slug}.pdf`, expenseReportToPDF(visibleExpenses, expensePeriodLabel));
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
        employeeId: employee?.id ?? user!.id,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : user!.name,
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

  return {
    user, isEmployee, employee,
    expenses, addExpenseClaim, updateExpenseStatus, deleteExpenseClaim, updateExpenseClaim,
    showModal, setShowModal, category, setCategory, amount, setAmount,
    date, setDate, description, setDescription, errors,
    submitting, editingId, receiptData, receiptName, fileKey,
    setReceiptData, setReceiptName, setFileKey,
    viewingReceipt, viewingExp, confirmApproveExp, setConfirmApproveExp,
    confirmRejectExp, setConfirmRejectExp, confirmDeleteExp, setConfirmDeleteExp,
    expenseMonth, setExpenseMonth, zoom, setZoom,
    visibleExpenses, expensePeriodLabel, totalPending,
    openReceipt, closeReceipt, zoomIn, zoomOut,
    handleExportPDF, resetForm, openNew, openEdit, handleFileChange, handleSubmit,
  };
}

export type UseExpensesViewReturn = ReturnType<typeof useExpensesView>;
