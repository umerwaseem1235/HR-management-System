'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Employee } from '@/lib/types';
import { getEmployee, getEmployeeAvatars, getEmployees, getLookupData } from '@/lib/actions/employees';
import { createResourceCache } from '@/lib/resource-cache';

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

// Survives view remounts during navigation, so returning to /employees paints
// instantly instead of re-running the (already lean) list query.
const employeesCache = createResourceCache<Employee[]>('employees:list', 60_000);
const lookupCache = createResourceCache<LookupData>('employees:lookup', 5 * 60_000);

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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [lookupData, setLookupData] = useState<LookupData | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lookupFetchedRef = useRef(false);
  // Becomes true once real (or cached) roster data has been applied; gates the
  // write-back effect so the empty initial state never overwrites the cache.
  const [ready, setReady] = useState(false);

  // Apply a roster to state, preserving already-known avatars so a revalidation
  // never makes photos flicker back to initials, then fill in any missing ones.
  const applyRoster = useCallback((incoming: Employee[]) => {
    setEmployees((prev) => {
      const known = new Map<string, string>();
      prev.forEach((e) => { if (e.avatar) known.set(e.id, e.avatar); });
      return incoming.map((e) => (!e.avatar && known.get(e.id) ? { ...e, avatar: known.get(e.id)! } : e));
    });
    const ids = incoming.map((e) => e.id);
    if (ids.length === 0) return;
    getEmployeeAvatars(ids)
      .then((avatarMap) => {
        if (Object.keys(avatarMap).length === 0) return;
        setEmployees((prev) =>
          prev.map((emp) => (avatarMap[emp.id] ? { ...emp, avatar: avatarMap[emp.id] } : emp))
        );
      })
      .catch(() => {});
  }, []);

  const fetchEmployees = useCallback(async (options?: { force?: boolean }) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await employeesCache.load(getEmployees, options);
      applyRoster(data);
      setReady(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [applyRoster]);

  // Silent background refresh — keeps the cached roster on failure.
  const revalidateEmployees = useCallback(async () => {
    try {
      const data = await employeesCache.load(getEmployees, { force: true });
      applyRoster(data);
      setReady(true);
    } catch {
      // Keep the cached roster.
    }
  }, [applyRoster]);

  const fetchLookup = useCallback(async () => {
    const snapshot = lookupCache.peek();
    if (snapshot) setLookupData(snapshot.data);
    if (snapshot && !snapshot.isStale) return;
    if (lookupFetchedRef.current) return;
    lookupFetchedRef.current = true;
    setIsLookupLoading(true);
    try {
      const data = await lookupCache.load(getLookupData);
      setLookupData(data);
    } catch (err) {
      console.error('Lookup fetch error:', err);
      lookupFetchedRef.current = false;
    } finally {
      setIsLookupLoading(false);
    }
  }, []);

  // Hydrate from cache on mount; only hit the server when there is nothing to
  // show. A stale snapshot is served immediately and revalidated in the
  // background (stale-while-revalidate).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const snapshot = employeesCache.peek();
      if (snapshot && !cancelled) {
        applyRoster(snapshot.data);
        setReady(true);
        setIsLoading(false);
        if (snapshot.isStale) void revalidateEmployees();
        return;
      }
      void fetchEmployees();
    })();
    return () => { cancelled = true; };
  }, [applyRoster, revalidateEmployees, fetchEmployees]);

  // Write roster changes (loads, avatars, add/edit/delete refreshes) back to the
  // shared cache so the next mount is current.
  useEffect(() => {
    if (!ready) return;
    employeesCache.set(employees);
  }, [ready, employees]);

  // Fetch lookup data in background or when modal is opened
  useEffect(() => {
    if (isAddEmployeeOpen || editingEmployee) {
      (async () => { await fetchLookup(); })();
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
      await fetchEmployees({ force: true });
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
      await fetchEmployees({ force: true });
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
      await fetchEmployees({ force: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
    }
  };

  const refresh = async () => {
    await fetchEmployees({ force: true });
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