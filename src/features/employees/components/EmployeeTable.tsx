'use client';

import React, { useEffect, useState } from 'react';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import { StatusBadge, TablePagination } from '@/components/shared';
import { paginate } from '@/utils/pagination';
import { Trash2, Eye, Pencil } from 'lucide-react';
import { Employee } from '@/types';

interface EmployeeTableProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onView?: (employee: Employee) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export default function EmployeeTable({ employees, onEdit, onView, onDelete, isLoading }: EmployeeTableProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  // Clamp when filters shrink the list; jump back to page 1 for a new result set.
  useEffect(() => {
    setPage(1);
  }, [employees.length]);
  const { totalPages, safePage, start, end, rows } = paginate(employees, page, perPage);

  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-gray border-b border-medium-gray">
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Employee</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Department</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Designation</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Branch</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-medium-gray">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-teal" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    Loading employees...
                  </div>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">No employees found matching your criteria.</td>
              </tr>
            ) : (
              rows.map(emp => (
                <tr key={emp.id} className="hover:bg-blue-gray dark:hover:bg-white/10/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${emp.firstName} ${emp.lastName}`} src={emp.avatar} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-dark-text dark:text-gray-100">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{emp.employeeCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-dark-text dark:text-gray-100">{emp.department}</td>
                  <td className="px-6 py-4 text-sm text-dark-text dark:text-gray-100">{emp.designation}</td>
                  <td className="px-6 py-4 text-sm text-dark-text dark:text-gray-100">{emp.branch}</td>
                  <td className="px-6 py-4"><StatusBadge status={emp.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {onView && (
                        <button
                          type="button"
                          onClick={() => onView(emp)}
                          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-teal hover:bg-blue-gray dark:hover:bg-white/10 transition-colors"
                          title="View"
                          aria-label={`View ${emp.firstName} ${emp.lastName}`}
                        >
                          <Eye size={16} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onEdit(emp)}
                        className="p-2 rounded-lg text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-teal hover:bg-blue-gray dark:hover:bg-white/10 transition-colors"
                        title="Edit"
                        aria-label={`Edit ${emp.firstName} ${emp.lastName}`}
                      >
                        <Pencil size={16} />
                      </button>
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(emp.id)}
                          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 transition-colors"
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
        <div className="p-12 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500">No employees found matching your criteria.</div>
      )}
      {!isLoading && (
        <TablePagination
          page={safePage}
          totalPages={totalPages}
          totalCount={employees.length}
          start={start}
          end={end}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={(n) => {
            setPerPage(n);
            setPage(1);
          }}
        />
      )}
    </Card>
  );
}
