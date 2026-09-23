'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { UserPlus, AlertCircle, Trash2 } from 'lucide-react';
import EmployeeFilters from './EmployeeFilters';
import EmployeeTable from './EmployeeTable';
import EmployeeFormModal from './EmployeeFormModal';
import { useEmployeesSupabase } from '../hooks/useEmployeesSupabase';
import type { Employee } from '@/types';

export default function EmployeesView() {
  const router = useRouter();
  const {
    search,
    setSearch,
    deptFilter,
    setDeptFilter,
    statusFilter,
    setStatusFilter,
    isAddEmployeeOpen,
    setIsAddEmployeeOpen,
    filtered,
    isLoading,
    error,
    editingEmployee,
    openEditor,
    closeEditor,
    lookupData,
    isLookupLoading,
    isSubmitting,
    handleAddEmployee,
    handleEditEmployee,
    handleDeleteEmployee,
  } = useEmployeesSupabase();
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      await handleDeleteEmployee(employeeToDelete.id);
      setEmployeeToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        actions={
          <Button
            variant="primary"
            onClick={() => setIsAddEmployeeOpen(true)}
          >
            <UserPlus size={16} /> Add Employee
          </Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50/80 px-4 py-3 text-red-700">
          <AlertCircle size={18} />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <EmployeeFilters
        search={search}
        onSearchChange={setSearch}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <EmployeeTable
        employees={filtered}
        onView={(emp) => router.push(`/employees/${emp.id}`)}
        onEdit={openEditor}
        onDelete={(id) => setEmployeeToDelete(filtered.find((e) => e.id === id) ?? null)}
        isLoading={isLoading}
      />

      <EmployeeFormModal
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onSave={handleAddEmployee}
        lookupData={lookupData}
        isLookupLoading={isLookupLoading}
        isSubmitting={isSubmitting}
        isCreatingAccount
        submitError={error}
      />
      {editingEmployee && (
        <EmployeeFormModal
          key={editingEmployee.id}
          isOpen
          employee={editingEmployee}
          onClose={closeEditor}
          onSave={handleEditEmployee}
          lookupData={lookupData}
          isLookupLoading={isLookupLoading}
          isSubmitting={isSubmitting}
          submitError={error}
        />
      )}

      <ConfirmDialog
        isOpen={!!employeeToDelete}
        onClose={() => !isDeleting && setEmployeeToDelete(null)}
        title="Delete Employee?"
        variant="delete"
        headline={
          <>
            Delete{' '}
            <span className="font-semibold text-[#17324D]">
              {employeeToDelete?.firstName} {employeeToDelete?.lastName}
            </span>
            {employeeToDelete?.employeeCode ? ` (${employeeToDelete.employeeCode})` : ''}?
          </>
        }
        subline={
          employeeToDelete
            ? `${employeeToDelete.department} · ${employeeToDelete.designation} · ${employeeToDelete.email}`
            : undefined
        }
        note={
          <>
            This action <span className="font-semibold">cannot be undone</span>. The employee record will be permanently removed.
          </>
        }
        confirmLabel="Delete"
        confirmIcon={<Trash2 size={16} />}
        onConfirm={confirmDelete}
        loading={isDeleting}
      />
    </div>
  );
}