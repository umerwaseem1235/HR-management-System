'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import { EmployeeCell } from '@/components/shared';
import { Eye, Pencil, Trash2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import type { ProgressEntry } from '@/types';
import { formatSubmission, PAGE_SIZES } from '../hooks/useProgressView';

interface ProgressListProps {
  pageRows: ProgressEntry[];
  safePage: number;
  pageSize: number;
  totalPages: number;
  start: number;
  end: number;
  filteredCount: number;
  query: string;
  fromDate: string;
  toDate: string;
  isEmployee: boolean;
  onView: (entry: ProgressEntry) => void;
  onEdit: (entry: ProgressEntry) => void;
  onDelete: (entry: ProgressEntry) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function ProgressList({
  pageRows, safePage, pageSize, totalPages, start, end, filteredCount,
  query, fromDate, toDate, isEmployee,
  onView, onEdit, onDelete, onPageChange, onPageSizeChange,
}: ProgressListProps) {
  return (
    <Card padding="none">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-gray border-b border-medium-gray">
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">#</th>
              {!isEmployee && (
                <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Employee Name</th>
              )}
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Project Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Submission Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-medium-gray">
            {pageRows.map((entry, idx) => (
              <tr key={entry.id} className="hover:bg-blue-gray dark:hover:bg-white/10/50">
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{(safePage - 1) * pageSize + idx + 1}</td>
                {!isEmployee && (
                  <td className="px-6 py-4"><EmployeeCell name={entry.employeeName || '—'} employeeId={entry.employeeId} avatar={entry.employeeAvatar} /></td>
                )}
                <td className="px-6 py-4 text-sm font-medium text-dark-text dark:text-gray-100">{entry.projectName}</td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{formatSubmission(entry.submissionDate)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title="View"
                      onClick={() => onView(entry)}
                      className="p-1.5 rounded-lg bg-blue-gray text-[#0F8B8D] hover:bg-medium-gray cursor-pointer"
                    >
                      <Eye size={16} />
                    </button>
                    {isEmployee && (
                      <>
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => onEdit(entry)}
                          className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:bg-blue-950/40 cursor-pointer"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => onDelete(entry)}
                          className="p-1.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-950/30 dark:bg-red-950/30 hover:text-red-600 dark:text-red-400 cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pageRows.length === 0 && (
          <div className="p-6">
            <EmptyState
              title="No progress entries"
              description={query || fromDate || toDate ? 'No entries match your filters. Try clearing them.' : isEmployee ? 'Click “Add Progress” to log your first update.' : 'No progress entries have been submitted yet.'}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-medium-gray bg-white dark:bg-[#1b263b] px-6 py-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
          <span>Records per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-medium-gray bg-white dark:bg-[#1b263b] px-2 py-1.5 text-sm text-dark-text dark:text-gray-100 outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{start} - {end} of {filteredCount}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(1)}
            title="First page"
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-blue-gray dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            title="Previous page"
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-blue-gray dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="w-8 h-8 rounded-lg text-sm font-medium bg-teal text-white flex items-center justify-center">
            {safePage}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            title="Next page"
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-blue-gray dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            title="Last page"
            className="p-2 rounded-lg text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-blue-gray dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}
