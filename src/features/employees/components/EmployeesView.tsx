'use client';

import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { UserPlus, AlertCircle } from 'lucide-react';
import EmployeeFilters from './EmployeeFilters';
import EmployeeTable from './EmployeeTable';
import EmployeeFormModal from './EmployeeFormModal';
import { useEmployeesSupabase } from '../hooks/useEmployeesSupabase';

export default function EmployeesView() {
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
        onEdit={openEditor}
        onDelete={handleDeleteEmployee}
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
    </div>
  );
}