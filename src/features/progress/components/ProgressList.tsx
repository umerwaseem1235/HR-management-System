'use client';

import React from 'react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
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
            <tr className="bg-[#EAF2F4] border-b border-[#D6E4E8]">
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">#</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Project Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Submission Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-[#17324D] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D6E4E8]">
            {pageRows.map((entry, idx) => (
              <tr key={entry.id} className="hover:bg-[#EAF2F4]/50">
                <td className="px-6 py-4 text-sm text-gray-500">{(safePage - 1) * pageSize + idx + 1}</td>
                <td className="px-6 py-4 text-sm font-medium text-[#263238]">{entry.projectName}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{formatSubmission(entry.submissionDate)}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      title="View"
                      onClick={() => onView(entry)}
                      className="p-1.5 rounded-lg bg-[#EAF2F4] text-[#0F8B8D] hover:bg-[#D6E4E8] cursor-pointer"
                    >
                      <Eye size={16} />
                    </button>
                    {isEmployee && (
                      <>
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => onEdit(entry)}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 cursor-pointer"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => onDelete(entry)}
                          className="p-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600 cursor-pointer"
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

      <div className="flex flex-col gap-3 border-t border-[#D6E4E8] bg-white px-6 py-3 sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Records per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-[#D6E4E8] bg-white px-2 py-1.5 text-sm text-[#263238] outline-none focus:border-[#024fa7] focus:ring-2 focus:ring-[#024fa7]/20"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-gray-500">{start} - {end} of {filteredCount}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(1)}
            title="First page"
            className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => onPageChange(Math.max(1, safePage - 1))}
            title="Previous page"
            className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="w-8 h-8 rounded-lg text-sm font-medium bg-[#024fa7] text-white flex items-center justify-center">
            {safePage}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
            title="Next page"
            className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => onPageChange(totalPages)}
            title="Last page"
            className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
}
