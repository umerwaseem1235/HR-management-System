'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Employee } from '@/lib/types';
import { getEmployees, getLookupData } from '@/lib/actions/employees';

interface LookupItem {
  id: string;
  name: string;
}

interface LookupData {
  departments: LookupItem[];
  designations: LookupItem[];
  branches: LookupItem[];
  shifts: LookupItem[];
  managers: LookupItem[];
}

interface UseEmployeesSupabaseReturn {
  search: string;
  setSearch: (v: string) => void;
  deptFilter: string;
  setDeptFilter: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  isAddEmployeeOpen: boolean;
  setIsAddEmployeeOpen: (v: boolean) => void;
  employees: Employee[];
  filtered: Employee[];
  isLoading: boolean;
  error: string | null;
  editingEmployee: Employee | null;
  setEditingEmployee: (e: Employee | null) => void;
  lookupData: LookupData | null;
  isLookupLoading: boolean;
  isSubmitting: boolean;
  handleAddEmployee: (values: Record<string, string>, photo: string | null) => Promise<void>;
  handleEditEmployee: (values: Record<string, string>, photo: string | null) => Promise<void>;
  handleDeleteEmployee: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useEmployeesSupabase(): UseEmployeesSupabaseReturn {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [lookupData, setLookupData] = useState<LookupData | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lookupFetchedRef = useRef(false);

  const fetchEmployees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLookup = useCallback(async () => {
    if (lookupFetchedRef.current) return;
    lookupFetchedRef.current = true;
    setIsLookupLoading(true);
    try {
      const data = await getLookupData();
      setLookupData(data);
    } catch (err) {
      console.error('Lookup fetch error:', err);
      lookupFetchedRef.current = false;
    } finally {
      setIsLookupLoading(false);
    }
  }, []);

  // Fetch employees on mount
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Fetch lookup data in background or when modal is opened
  useEffect(() => {
    if (isAddEmployeeOpen || editingEmployee) {
      fetchLookup();
    }
  }, [isAddEmployeeOpen, editingEmployee, fetchLookup]);

  // Filter employees
  useEffect(() => {
    const q = search.trim().toLowerCase();
    const result = employees.filter(emp => {
      const matchSearch = !q || `${emp.firstName} ${emp.lastName} ${emp.employeeCode} ${emp.email} ${emp.department} ${emp.designation} ${emp.branch} ${emp.phone || ''}`.toLowerCase().includes(q);
      const matchDept = !deptFilter || emp.department === deptFilter;
      const matchStatus = !statusFilter || emp.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
    setFiltered(result);
  }, [search, deptFilter, statusFilter, employees]);

  const handleAddEmployee = async (values: Record<string, string>, photo: string | null) => {
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, avatar: photo }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create employee');
      }
      await fetchEmployees();
      setIsAddEmployeeOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create employee');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditEmployee = async (values: Record<string, string>, photo: string | null) => {
    if (!editingEmployee) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/employees/${editingEmployee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, avatar: photo }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to update employee');
      }
      await fetchEmployees();
      setEditingEmployee(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    setError(null);
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete employee');
      await fetchEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
    }
  };

  const refresh = async () => {
    await fetchEmployees();
  };

  return {
    search,
    setSearch,
    deptFilter,
    setDeptFilter,
    statusFilter,
    setStatusFilter,
    isAddEmployeeOpen,
    setIsAddEmployeeOpen,
    employees,
    filtered,
    isLoading,
    error,
    editingEmployee,
    setEditingEmployee,
    lookupData,
    isLookupLoading,
    isSubmitting,
    handleAddEmployee,
    handleEditEmployee,
    handleDeleteEmployee,
    refresh,
  };
}