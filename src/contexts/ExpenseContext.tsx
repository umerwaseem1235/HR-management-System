'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ExpenseClaim } from '../lib/types';
import { mockExpenses } from '../lib/mock-data';

export interface NewExpenseInput {
  employeeId: string;
  employeeName: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

interface ExpenseContextType {
  expenses: ExpenseClaim[];
  addExpenseClaim: (input: NewExpenseInput) => ExpenseClaim;
  updateExpenseStatus: (id: string, status: 'Approved' | 'Rejected' | 'Reimbursed') => void;
  deleteExpenseClaim: (id: string) => void;
  updateExpenseClaim: (id: string, input: { category: string; amount: number; date: string; description: string }) => void;
}

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

const STORAGE_KEY = 'hrms_expenses';

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [expenses, setExpenses] = useState<ExpenseClaim[]>(mockExpenses);

  // Load persisted claims (including employee-submitted ones) after mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setExpenses(JSON.parse(stored));
      }
    } catch {
      // Corrupt storage — keep mock defaults
    }
  }, []);

  // Persist so submitted claims survive reloads
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    } catch {
      // Storage unavailable — ignore
    }
  }, [expenses]);

  const addExpenseClaim = (input: NewExpenseInput): ExpenseClaim => {
    const claim: ExpenseClaim = {
      id: `exp-${Date.now()}`,
      ...input,
      status: 'Pending',
      submittedOn: new Date().toISOString().slice(0, 10),
    };
    setExpenses((prev) => [claim, ...prev]);
    return claim;
  };

  const updateExpenseStatus = (id: string, status: 'Approved' | 'Rejected' | 'Reimbursed') => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
  };

  const deleteExpenseClaim = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const updateExpenseClaim = (id: string, input: { category: string; amount: number; date: string; description: string }) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...input } : e)));
  };

  return (
    <ExpenseContext.Provider value={{ expenses, addExpenseClaim, updateExpenseStatus, deleteExpenseClaim, updateExpenseClaim }}>
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
