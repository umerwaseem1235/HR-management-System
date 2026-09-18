'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ExpenseClaim } from '../lib/types';
import { getExpenseClaims, createExpenseClaim, updateExpenseStatus as updateExpenseStatusAction, deleteExpenseClaim as deleteExpenseClaimAction, updateExpenseClaim as updateExpenseClaimAction } from '@/lib/actions/expenses';

export interface NewExpenseInput {
  employeeId: string;
  employeeName: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  receipt?: string;
}

interface ExpenseContextType {
  expenses: ExpenseClaim[];
  isLoading: boolean;
  addExpenseClaim: (input: NewExpenseInput) => Promise<ExpenseClaim>;
  updateExpenseStatus: (id: string, status: 'Approved' | 'Rejected' | 'Reimbursed') => Promise<void>;
  deleteExpenseClaim: (id: string) => Promise<void>;
  updateExpenseClaim: (id: string, input: { category: string; amount: number; date: string; description: string; receipt?: string }) => Promise<void>;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<ExpenseClaim[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getExpenseClaims();
        setExpenses(data);
      } catch (error) {
        console.error('Failed to load expenses:', error);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const addExpenseClaim = async (input: NewExpenseInput): Promise<ExpenseClaim> => {
    const claim = await createExpenseClaim({
      employeeId: input.employeeId,
      category: input.category,
      amount: input.amount,
      date: input.date,
      description: input.description,
      receipt: input.receipt
    });
    setExpenses((prev) => [claim, ...prev]);
    return claim;
  };

  const updateExpenseStatus = async (id: string, status: 'Approved' | 'Rejected' | 'Reimbursed') => {
    await updateExpenseStatusAction(id, status);
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  };

  const deleteExpenseClaim = async (id: string) => {
    await deleteExpenseClaimAction(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const updateExpenseClaim = async (id: string, input: { category: string; amount: number; date: string; description: string; receipt?: string }) => {
    await updateExpenseClaimAction(id, input);
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...input } : e)));
  };

  return (
    <ExpenseContext.Provider value={{ expenses, isLoading, addExpenseClaim, updateExpenseStatus, deleteExpenseClaim, updateExpenseClaim }}>
      {children}
    </ExpenseContext.Provider>
  );
}

export function useExpense() {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
}
