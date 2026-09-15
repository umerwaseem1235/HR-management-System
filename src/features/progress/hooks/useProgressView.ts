import { useMemo, useState } from 'react';
import { mockEmployees } from '@/lib/mock-data';
import { useAuth } from '@/contexts/AuthContext';
import { useProgress } from '@/contexts/ProgressContext';
import { ProgressEntry } from '@/types';

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];

export function formatSubmission(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  if (!y || !m || !d) return dateStr;
  return `${String(d).padStart(2, '0')}-${MONTHS[m - 1]}-${y}`;
}

export const PAGE_SIZES = [5, 10, 20];

export function stripHtml(html: string): string {
  return html
    .replace(/<(br|p|div|li|h1|h2|h3)[^>]*>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function noteStats(html: string): { words: number; chars: number } {
  const text = stripHtml(html);
  return {
    words: text ? text.split(' ').filter(Boolean).length : 0,
    chars: text.length,
  };
}

export function useProgressView() {
  const { user } = useAuth();
  const { entries, addEntry, updateEntry, deleteEntry } = useProgress();

  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState('');
  const [submissionDate, setSubmissionDate] = useState('');
  const [description, setDescription] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [viewing, setViewing] = useState<ProgressEntry | null>(null);
  const [confirmDeleteEntry, setConfirmDeleteEntry] = useState<ProgressEntry | null>(null);

  const employee = useMemo(() => {
    if (!user) return undefined;
    return (
      mockEmployees.find((e) => e.email.toLowerCase() === user.email.toLowerCase()) ||
      mockEmployees.find(
        (e) => `${e.firstName} ${e.lastName}`.toLowerCase() === user.name.toLowerCase(),
      )
    );
  }, [user]);

  const isEmployee = user?.role === 'employee';

  // Employees only see their own progress; admins/HR see everything
  const visible = useMemo(() => {
    if (!isEmployee) return entries;
    if (!user) return [];
    return entries.filter((e) =>
      employee ? e.employeeId === employee.id : e.employeeName.toLowerCase() === user.name.toLowerCase(),
    );
  }, [entries, isEmployee, employee, user]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return visible
      .filter((e) => {
        if (q && !`${e.projectName} ${e.description}`.toLowerCase().includes(q)) return false;
        if (fromDate && e.submissionDate < fromDate) return false;
        if (toDate && e.submissionDate > toDate) return false;
        return true;
      })
      .sort((a, b) => (a.submissionDate < b.submissionDate ? -1 : a.submissionDate > b.submissionDate ? 1 : 0));
  }, [visible, query, fromDate, toDate]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, filtered.length);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const projectNames = useMemo(
    () => Array.from(new Set(entries.map((e) => e.projectName))).sort(),
    [entries],
  );

  const stats = useMemo(() => noteStats(description), [description]);

  const resetForm = () => {
    setEditingId(null);
    setProjectName('');
    setSubmissionDate('');
    setDescription('');
    setFormErrors({});
  };

  const openAdd = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEdit = (entry: ProgressEntry) => {
    setEditingId(entry.id);
    setProjectName(entry.projectName);
    setSubmissionDate(entry.submissionDate);
    setDescription(entry.description);
    setFormErrors({});
    setShowFormModal(true);
  };

  const closeForm = () => {
    setShowFormModal(false);
    resetForm();
  };

  const clearDescriptionError = () => {
    setFormErrors((prev) => {
      if (!prev.description) return prev;
      const next = { ...prev };
      delete next.description;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const nextErrors: Record<string, string> = {};
    if (!projectName.trim()) nextErrors.projectName = 'Please enter a project name.';
    if (!submissionDate) nextErrors.submissionDate = 'Submission date is required.';
    if (!stripHtml(description)) nextErrors.description = 'Please add a short progress summary.';
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (editingId) {
      updateEntry(editingId, {
        projectName: projectName.trim(),
        submissionDate,
        description: description.trim(),
      });
    } else {
      addEntry({
        projectName: projectName.trim(),
        submissionDate,
        description: description.trim(),
        employeeId: employee?.id ?? user.id,
        employeeName: employee ? `${employee.firstName} ${employee.lastName}` : user.name,
      });
    }
    closeForm();
  };

  const confirmDelete = () => {
    if (confirmDeleteEntry) deleteEntry(confirmDeleteEntry.id);
    setConfirmDeleteEntry(null);
  };

  return {
    user,
    isEmployee,
    query, setQuery,
    fromDate, setFromDate,
    toDate, setToDate,
    page, setPage, pageSize, setPageSize,
    showFormModal, editingId,
    projectName, setProjectName,
    submissionDate, setSubmissionDate,
    description, setDescription,
    formErrors,
    viewing, setViewing,
    confirmDeleteEntry, setConfirmDeleteEntry,
    filtered, totalPages, safePage, start, end, pageRows,
    projectNames, stats,
    resetForm, openAdd, openEdit, closeForm, clearDescriptionError,
    handleSubmit, confirmDelete,
  };
}

export type UseProgressViewReturn = ReturnType<typeof useProgressView>;
