'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/shared';
import { Mail, Phone, Pencil } from 'lucide-react';
import { Employee } from '@/types';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
}

export default function EmployeeTable({ employees, onEdit }: EmployeeTableProps) {
  return (
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
            {employees.map(emp => (
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
                <td className="px-6 py-4"><StatusBadge status={emp.status} /></td>
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
                    onClick={() => onEdit(emp)}
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
      {employees.length === 0 && (
        <div className="p-12 text-center text-gray-500">No employees found matching your criteria.</div>
      )}
    </Card>
  );
}
