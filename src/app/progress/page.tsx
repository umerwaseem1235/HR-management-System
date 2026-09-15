'use client';

import React, { useMemo, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Plus } from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';
import { useAuth } from '../../contexts/AuthContext';
import { useRequireAuth, AuthLoadingFallback } from '../../components/auth/RequireAuth';
import { useProgress } from '../../contexts/ProgressContext';
import { ProgressEntry } from '../../lib/types';
import ProgressFilters from '../../components/progress/ProgressFilters';
import ProgressTable from '../../components/progress/ProgressTable';
import ProgressFormModal from '../../components/progress/ProgressFormModal';
import ProgressViewModal from '../../components/progress/ProgressViewModal';
import { stripHtml, noteStats, PAGE_SIZES } from '../../components/progress/progress-utils';

export default function ProgressPage() {
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

  useRequireAuth();
  if (!user) return <AuthLoadingFallback />;

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

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this progress entry?')) deleteEntry(id);
  };

  const handleDescriptionChange = (html: string) => {
    setDescription(html);
    setFormErrors((prev) => {
      if (!prev.description) return prev;
      const next = { ...prev };
      delete next.description;
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          title="Progress"
          actions={
            <Button variant="primary" onClick={openAdd}>
              <Plus size={16} /> Add Progress
            </Button>
          }
        />

        <ProgressFilters
          query={query}
          fromDate={fromDate}
          toDate={toDate}
          onQueryChange={(v) => { setQuery(v); setPage(1); }}
          onFromDateChange={(v) => { setFromDate(v); setPage(1); }}
          onToDateChange={(v) => { setToDate(v); setPage(1); }}
        />

        <ProgressTable
          pageRows={pageRows}
          safePage={safePage}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZES}
          totalPages={totalPages}
          start={start}
          end={end}
          filteredLength={filtered.length}
          query={query}
          fromDate={fromDate}
          toDate={toDate}
          onView={(entry) => setViewing(entry)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onPageChange={(p) => setPage(p)}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
        />
      </div>

      {/* Add / Edit modal — matches the reference design, dressed in project theme */}
      <ProgressFormModal
        isOpen={showFormModal}
        editingId={editingId}
        projectName={projectName}
        submissionDate={submissionDate}
        description={description}
        formErrors={formErrors}
        projectNames={projectNames}
        stats={stats}
        onClose={closeForm}
        onSubmit={handleSubmit}
        onProjectNameChange={(v) => setProjectName(v)}
        onSubmissionDateChange={(v) => setSubmissionDate(v)}
        onDescriptionChange={handleDescriptionChange}
      />

      {/* View modal — assignment / timeline / notes sections like the reference */}
      <ProgressViewModal
        viewing={viewing}
        onClose={() => setViewing(null)}
      />
    </DashboardLayout>
  );
}
