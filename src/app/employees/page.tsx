'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import AddEmployeeModal from '../../components/employees/AddEmployeeModal';
import EmployeeFilters from '../../components/employees/EmployeeFilters';
import EmployeeTable from '../../components/employees/EmployeeTable';
import { UserPlus } from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';
import { BRANCHES, SHIFTS } from '../../lib/constants';
import { Employee } from '../../lib/types';

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const filtered = employees.filter(emp => {
    const q = search.trim().toLowerCase();
    const matchSearch = !q || `${emp.firstName} ${emp.lastName} ${emp.employeeCode} ${emp.email} ${emp.department} ${emp.designation} ${emp.branch} ${emp.phone}`.toLowerCase().includes(q);
    const matchDept = !deptFilter || emp.department === deptFilter;
    const matchStatus = !statusFilter || emp.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const handleAddEmployee = (values: Record<string, string>, photo: string | null) => {
    const newEmployee: Employee = {
      id: `emp-${Date.now()}`,
      employeeCode: values.employeeCode || `EMP${employees.length + 1}`,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone || '',
      dateOfBirth: values.dateOfBirth || '',
      gender: 'Male',
      address: values.address || '',
      city: values.city || '',
      country: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      department: values.department,
      designation: values.designation,
      branch: BRANCHES.find(branch => branch.id === values.branch)?.name || values.branch,
      reportingManager: values.reportingManager || '',
      employmentType: (values.employmentType || 'Full-time') as Employee['employmentType'],
      joiningDate: values.joiningDate,
      probationEndDate: values.probationEndDate || undefined,
      confirmationDate: values.confirmationDate || undefined,
      status: 'Active',
      shift: SHIFTS.find(shift => shift.id === values.shift)?.name || values.shift,
      bankName: values.bankName || undefined,
      bankAccount: values.bankAccount || undefined,
      taxId: values.taxId || undefined,
      salary: values.salary ? Number(values.salary) : undefined,
      avatar: photo || undefined,
    };
    setEmployees(current => [newEmployee, ...current]);
    setIsAddEmployeeOpen(false);
  };

  const handleEditEmployee = (values: Record<string, string>, photo: string | null) => {
    if (!editingEmployee) return;
    setEmployees(current => current.map(emp => emp.id === editingEmployee.id ? {
      ...emp,
      employeeCode: values.employeeCode || emp.employeeCode,
      firstName: values.firstName || emp.firstName,
      lastName: values.lastName || emp.lastName,
      email: values.email || emp.email,
      phone: values.phone || emp.phone,
      dateOfBirth: values.dateOfBirth || emp.dateOfBirth,
      address: values.address || emp.address,
      city: values.city || emp.city,
      department: values.department || emp.department,
      designation: values.designation || emp.designation,
      branch: BRANCHES.find(branch => branch.id === values.branch)?.name || emp.branch,
      reportingManager: values.reportingManager || emp.reportingManager,
      employmentType: (values.employmentType || emp.employmentType) as Employee['employmentType'],
      joiningDate: values.joiningDate || emp.joiningDate,
      probationEndDate: values.probationEndDate || emp.probationEndDate,
      confirmationDate: values.confirmationDate || emp.confirmationDate,
      shift: SHIFTS.find(shift => shift.id === values.shift)?.name || emp.shift,
      bankName: values.bankName || emp.bankName,
      bankAccount: values.bankAccount || emp.bankAccount,
      taxId: values.taxId || emp.taxId,
      salary: values.salary ? Number(values.salary) : emp.salary,
      avatar: photo || emp.avatar,
    } : emp));
    setEditingEmployee(null);
  };

  return (
    <DashboardLayout>
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
          searchFocused={searchFocused}
          deptFilter={deptFilter}
          statusFilter={statusFilter}
          onSearchChange={setSearch}
          onSearchFocus={() => setSearchFocused(true)}
          onSearchBlur={() => { if (!search.trim()) setSearchFocused(false); }}
          onClearSearch={() => { setSearch(''); setSearchFocused(false); }}
          onDeptChange={setDeptFilter}
          onStatusChange={setStatusFilter}
        />

        <EmployeeTable employees={filtered} onEdit={setEditingEmployee} />

        <AddEmployeeModal isOpen={isAddEmployeeOpen} onClose={() => setIsAddEmployeeOpen(false)} onSave={handleAddEmployee} />
        {editingEmployee && (
          <AddEmployeeModal
            key={editingEmployee.id}
            isOpen
            employee={editingEmployee}
            onClose={() => setEditingEmployee(null)}
            onSave={handleEditEmployee}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
