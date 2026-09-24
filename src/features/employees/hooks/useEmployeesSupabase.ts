'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Employee } from '@/lib/types';
<<<<<<< HEAD
import { getEmployee, getEmployeeAvatars, getEmployees, getLookupData } from '@/lib/actions/employees';
import { createResourceCache } from '@/lib/resource-cache';
=======
import { getEmployee, getEmployees, getLookupData } from '@/lib/actions/employees';
import { cachedQuery, invalidateQuery, peekQuery } from '@/lib/query-cache';

export const EMPLOYEES_CACHE_KEY = 'employees';
export const EMPLOYEE_LOOKUP_CACHE_KEY = 'employees:lookup';
>>>>>>> 77f10f9747aad4e0dd6e5708d9f89134faf2b97a

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
  const [employees, setEmployees] = useState<Employee[]>(() => peekQuery<Employee[]>(EMPLOYEES_CACHE_KEY) ?? []);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  // Instant first paint when a fresh cache entry exists (recent tab visit).
  const [isLoading, setIsLoading] = useState(() => peekQuery<Employee[]>(EMPLOYEES_CACHE_KEY) === undefined);
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
<<<<<<< HEAD
      const data = await employeesCache.load(getEmployees, options);
      applyRoster(data);
      setReady(true);
=======
      const data = await cachedQuery(EMPLOYEES_CACHE_KEY, getEmployees);
      setEmployees(data);
>>>>>>> 77f10f9747aad4e0dd6e5708d9f89134faf2b97a
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
<<<<<<< HEAD
      const data = await lookupCache.load(getLookupData);
=======
      const data = await cachedQuery(EMPLOYEE_LOOKUP_CACHE_KEY, getLookupData);
>>>>>>> 77f10f9747aad4e0dd6e5708d9f89134faf2b97a
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

  // Drop cached reads before refetching so mutations are always visible.
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
<<<<<<< HEAD
      await fetchEmployees({ force: true });
=======
      await refreshEmployees();
>>>>>>> 77f10f9747aad4e0dd6e5708d9f89134faf2b97a
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
<<<<<<< HEAD
      await fetchEmployees({ force: true });
=======
      await refreshEmployees();
>>>>>>> 77f10f9747aad4e0dd6e5708d9f89134faf2b97a
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
<<<<<<< HEAD
      await fetchEmployees({ force: true });
=======
      await refreshEmployees();
>>>>>>> 77f10f9747aad4e0dd6e5708d9f89134faf2b97a
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete employee');
    }
  };

  const refresh = async () => {
<<<<<<< HEAD
    await fetchEmployees({ force: true });
=======
    await refreshEmployees();
>>>>>>> 77f10f9747aad4e0dd6e5708d9f89134faf2b97a
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