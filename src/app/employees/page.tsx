'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';
import SearchBar from '../../components/ui/SearchBar';
import Select from '../../components/ui/Select';
import { UserPlus, MoreVertical, Mail, Phone } from 'lucide-react';
import { mockEmployees } from '../../lib/mock-data';
import { DEPARTMENTS } from '../../lib/constants';

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = mockEmployees.filter(emp => {
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#17324D]">Employees</h1>
            <p className="text-sm text-gray-500 mt-1">{mockEmployees.length} total employees</p>
          </div>
          <Button variant="primary">
            <UserPlus size={16} /> Add Employee
          </Button>
        </div>

        {/* Filters */}
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

        {/* Employee List */}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6E4E8]">
                {filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-[#EAF2F4]/50 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={`${emp.firstName} ${emp.lastName}`} size="sm" />
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
                        <button className="p-1 rounded text-gray-400 hover:text-[#0F8B8D] hover:bg-[#EAF2F4]" title={emp.email}>
                          <Mail size={14} />
                        </button>
                        <button className="p-1 rounded text-gray-400 hover:text-[#0F8B8D] hover:bg-[#EAF2F4]" title={emp.phone}>
                          <Phone size={14} />
                        </button>
                      </div>
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
      </div>
    </DashboardLayout>
  );
}
