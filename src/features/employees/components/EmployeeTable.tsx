'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/shared';
import { Trash2, Eye, Pencil, Mail, Phone } from 'lucide-react';
import { Employee } from '@/types';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onView?: (employee: Employee) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export default function EmployeeTable({ employees, onEdit, onView, onDelete, isLoading }: EmployeeTableProps) {
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
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-[#024fa7]" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Loading employees...
                  </div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">No employees found matching your criteria.</td>
              </tr>
            ) : (
              employees.map(emp => (
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
                  <td className="px-6 py-4 text-sm text-[#263238] whitespace-nowrap">{emp.joiningDate}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-gray-400">
                      {emp.email && <Mail size={16} title={emp.email} className="hover:text-[#024fa7] cursor-pointer transition-colors" />}
                      {emp.phone && <Phone size={16} title={emp.phone} className="hover:text-[#024fa7] cursor-pointer transition-colors" />}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {onView && (
                        <button
                          type="button"
                          onClick={() => onView(emp)}
                          className="p-2 rounded-lg text-gray-500 hover:text-[#024fa7] hover:bg-[#EAF2F4] transition-colors"
                          title="View"
                          aria-label={`View ${emp.firstName} ${emp.lastName}`}
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEdit(emp)}
                        className="p-2 rounded-lg text-gray-500 hover:text-[#024fa7] hover:bg-[#EAF2F4] transition-colors"
                        title="Edit"
                        aria-label={`Edit ${emp.firstName} ${emp.lastName}`}
                      >
                        <Pencil size={16} />
                      </button>
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(emp.id)}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                          aria-label={`Delete ${emp.firstName} ${emp.lastName}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!isLoading && employees.length === 0 && (
        <div className="p-12 text-center text-gray-500">No employees found matching your criteria.</div>
      )}
    </Card>
  );
}
