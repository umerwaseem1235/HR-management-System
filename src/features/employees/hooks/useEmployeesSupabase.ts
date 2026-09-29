'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Employee } from '@/lib/types';
import { getEmployee, getEmployees, getEmployeeAvatars, getLookupData } from '@/lib/actions/employees';
import { cachedQuery, invalidateQuery, peekQuery, primeQuery } from '@/lib/query-cache';

export const EMPLOYEES_CACHE_KEY = 'employees';
export const EMPLOYEE_LOOKUP_CACHE_KEY = 'employees:lookup';

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
  openEditor: (e: Employee) => void;
  closeEditor: () => void;
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
  const [employees, setEmployees] = useState<Employee[]>(() => peekQuery<Employee[]>(EMPLOYEES_CACHE_KEY) ?? []);
  // Derived synchronously during render instead of syncing via an effect.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter(emp => {
      const matchSearch = !q || `${emp.firstName} ${emp.lastName} ${emp.employeeCode} ${emp.email} ${emp.department} ${emp.designation} ${emp.branch} ${emp.phone || ''}`.toLowerCase().includes(q);
      const matchDept = !deptFilter || emp.department === deptFilter;
      const matchStatus = !statusFilter || emp.status === statusFilter;
      return matchSearch && matchDept && matchStatus;
    });
  }, [search, deptFilter, statusFilter, employees]);
  // Instant first paint when a fresh cache entry exists (recent tab visit).
  const [isLoading, setIsLoading] = useState(() => peekQuery<Employee[]>(EMPLOYEES_CACHE_KEY) === undefined);
  const [error, setError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [lookupData, setLookupData] = useState<LookupData | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lookupFetchedRef = useRef(false);

  const fetchEmployees = useCallback(async () => {
    // Stale-while-revalidate: a cached list paints instantly and revalidates
    // silently — only a cold start (no cache) may show the loading state.
    // This stops the table spinner flashing on every module switch.
    if (peekQuery<Employee[]>(EMPLOYEES_CACHE_KEY) === undefined) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const data = await cachedQuery(EMPLOYEES_CACHE_KEY, getEmployees);
      setEmployees(data);

      // The list query omits `avatar` for speed — fill photos in the
      // background and persist the merged list so remounts paint photos
      // instantly instead of initials. Skipped when every row already
      // carries a photo (i.e. the primed cache hit).
      if (data.some((e) => !e.avatar)) {
        try {
          const avatars = await getEmployeeAvatars(data.map((e) => e.id));
          if (Object.keys(avatars).length > 0) {
            setEmployees((prev) => {
              const merged = prev.map((emp) =>
                avatars[emp.id] ? { ...emp, avatar: avatars[emp.id] } : emp,
              );
              primeQuery(EMPLOYEES_CACHE_KEY, merged);
              return merged;
            });
          }
        } catch (err) {
          console.error('Failed to fetch avatars:', err);
        }
      }
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
      const data = await cachedQuery(EMPLOYEE_LOOKUP_CACHE_KEY, getLookupData);
      setLookupData(data);
    } catch (err) {
      console.error('Lookup fetch error:', err);
      lookupFetchedRef.current = false;
    } finally {
      setIsLookupLoading(false);
    }
  }, []);

  // Fetch employees on mount (subscription-style: state updates happen in
  // the async callback, not synchronously in the effect body).
  useEffect(() => {
    void (async () => {
      await fetchEmployees();
    })();
  }, [fetchEmployees]);

  // Fetch lookup data in background or when modal is opened.
  useEffect(() => {
    if (isAddEmployeeOpen || editingEmployee) {
      void (async () => {
        await fetchLookup();
      })();
    }
  }, [isAddEmployeeOpen, editingEmployee, fetchLookup]);

  // Token guards the background photo fetch so a late response can never
  // reopen/populate the editor after it was closed or switched.
  const editorToken = useRef(0);

  // Open the editor instantly with row data, then fill in the photo (which
  // the list query omits for speed) in the background once it arrives.
  const openEditor = useCallback((emp: Employee) => {
    const token = ++editorToken.current;
    setEditingEmployee(emp);
    if (!emp.avatar) {
      getEmployee(emp.id)
        .then((full) => {
          if (editorToken.current === token) setEditingEmployee(full);
        })
        .catch(() => {
          // Keep row data — the editor works, just without the old photo.
        });
    }
  }, []);

  const closeEditor = useCallback(() => {
    editorToken.current++;
    setEditingEmployee(null);
  }, []);

  const refreshEmployees = useCallback(async () => {
    invalidateQuery(EMPLOYEES_CACHE_KEY);
    invalidateQuery(EMPLOYEE_LOOKUP_CACHE_KEY);
    await fetchEmployees();
  }, [fetchEmployees]);

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
      // POST returns the created row WITH avatar — keep it so the new
      // employee's photo shows instantly instead of waiting for the
      // background avatar merge (the refreshed list omits avatars).
      const created = (await res.json()) as Employee;
      await refreshEmployees();
      if (created?.id && created.avatar) {
        setEmployees((prev) => {
          const merged = prev.map((e) =>
            e.id === created.id ? { ...e, avatar: created.avatar } : e,
          );
          primeQuery(EMPLOYEES_CACHE_KEY, merged);
          return merged;
        });
      }
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
      const updated = (await res.json()) as Employee;
      await refreshEmployees();
      if (updated?.id) {
        setEmployees((prev) => {
          const merged = prev.map((e) =>
            e.id === updated.id ? { ...e, avatar: updated.avatar ?? e.avatar } : e,
          );
          primeQuery(EMPLOYEES_CACHE_KEY, merged);
          return merged;
        });
      }
      setEditingEmployee(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update employee');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete employee');
      await refreshEmployees();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
    }
  };

  const refresh = async () => {
    await refreshEmployees();
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
    openEditor,
    closeEditor,
    lookupData,
    isLookupLoading,
    isSubmitting,
    handleAddEmployee,
    handleEditEmployee,
    handleDeleteEmployee,
    refresh,
  };
}