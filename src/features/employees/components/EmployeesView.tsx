'use client';

import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import { UserPlus } from 'lucide-react';
import EmployeeFilters from './EmployeeFilters';
import EmployeeTable from './EmployeeTable';
import EmployeeFormModal from './EmployeeFormModal';
import { useEmployees } from '../hooks/useEmployees';

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
    editingEmployee,
    setEditingEmployee,
    handleAddEmployee,
    handleEditEmployee,
  } = useEmployees();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        actions={
          <Button variant="primary" onClick={() => setIsAddEmployeeOpen(true)}>
            <UserPlus size={16} /> Add Employee
          </Button>
        }
      />

      <EmployeeFilters
        search={search}
        onSearchChange={setSearch}
        deptFilter={deptFilter}
        onDeptFilterChange={setDeptFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      <EmployeeTable employees={filtered} onEdit={setEditingEmployee} />

      <EmployeeFormModal isOpen={isAddEmployeeOpen} onClose={() => setIsAddEmployeeOpen(false)} onSave={handleAddEmployee} />
      {editingEmployee && (
        <EmployeeFormModal
          key={editingEmployee.id}
          isOpen
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSave={handleEditEmployee}
        />
      )}
    </div>
  );
}
