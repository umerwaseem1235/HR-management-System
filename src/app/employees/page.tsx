'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import AddEmployeeModal from '../../components/employees/AddEmployeeModal';
import { UserPlus, Mail, Phone, Pencil } from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';
import { BRANCHES, DEPARTMENTS, SHIFTS } from '../../lib/constants';
import { Employee } from '../../lib/types';

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const filtered = employees.filter(emp => {
    const matchSearch = !search || `${emp.firstName} ${emp.lastName} ${emp.employeeCode}`.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || emp.department === deptFilter;
    const matchStatus = !statusFilter || emp.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'info'> = {
      Active: 'success', Inactive: 'danger', 'On Notice': 'warning', Probation: 'info',
    };
    return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
  };

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
          eyebrow="Workforce"
          title="Employees"
          subtitle={`${employees.length} total employees`}
          actions={
            <Button variant="primary" onClick={() => setIsAddEmployeeOpen(true)}>
              <UserPlus size={16} /> Add Employee
            </Button>
          }
        />

        <Card padding="sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by name or ID..."
              className="flex-1"
            />
            <Select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              options={[
                { value: '', label: 'All Departments' },
                ...DEPARTMENTS.map(d => ({ value: d, label: d })),
              ]}
            />
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All Status' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Probation', label: 'Probation' },
                { value: 'On Notice', label: 'On Notice' },
              ]}
            />
          </div>
        </Card>

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Designation</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Branch</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6E4E8]">
                {filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-[#EAF2F4]/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.avatar} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-[#263238]">{emp.firstName} {emp.lastName}</p>
                          <p className="text-xs text-gray-500">{emp.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#263238]">{emp.department}</td>
                    <td className="px-6 py-4 text-sm text-[#263238]">{emp.designation}</td>
                    <td className="px-6 py-4 text-sm text-[#263238]">{emp.branch}</td>
                    <td className="px-6 py-4">{statusBadge(emp.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{emp.joiningDate}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1 rounded text-gray-400 hover:text-[#024fa7] hover:bg-[#EAF2F4]" title={emp.email}>
                          <Mail size={14} />
                        </button>
                        <button className="p-1 rounded text-gray-400 hover:text-[#024fa7] hover:bg-[#EAF2F4]" title={emp.phone}>
                          <Phone size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => setEditingEmployee(emp)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#D6E4E8] px-3 py-1.5 text-sm font-medium text-[#024fa7] hover:bg-[#EAF2F4] transition-colors"
                        aria-label={`Edit ${emp.firstName} ${emp.lastName}`}
                      >
                        <Pencil size={14} /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="p-12 text-center text-gray-500">No employees found matching your criteria.</div>
          )}
        </Card>

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
