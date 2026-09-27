'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  perPage?: number;
  itemLabel?: string;
}

function pageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, current - 1, current, current + 1, total - 1, total]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push('…');
    out.push(p);
    prev = p;
  }
  return out;
}

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, perPage = 10, itemLabel = 'employees' }: PaginationProps) {
  if (totalPages <= 0) return null;

  const showInfo = typeof totalItems === 'number';
  const rangeStart = !showInfo || totalItems === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const rangeEnd = !showInfo ? 0 : Math.min(currentPage * perPage, totalItems ?? 0);

  // Single page: no pagination UI needed.
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-6 py-3 bg-white border-t border-[#D6E4E8] rounded-b-2xl">
      {showInfo ? (
        <p className="text-sm text-gray-500 tabular-nums">
          Showing <span className="font-medium text-[#263238]">{rangeStart}–{rangeEnd}</span> of{' '}
          <span className="font-medium text-[#263238]">{totalItems}</span> {itemLabel}
        </p>
      ) : (
        <p className="text-sm text-gray-500">Page {currentPage} of {totalPages}</p>
      )}
      <div className="flex items-center gap-1 sm:ml-auto">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Previous page"
          aria-label="Previous page"
          className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>
        {pageWindow(currentPage, totalPages).map((page, i) =>
          page === '…' ? (
            <span key={`gap-${i}`} className="w-8 text-center text-sm text-gray-400">…</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? 'page' : undefined}
              className={`w-8 h-8 rounded-lg text-sm font-medium cursor-pointer ${
                page === currentPage
                  ? 'bg-[#024fa7] text-white'
                  : 'text-gray-500 hover:bg-[#EAF2F4]'
              }`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          title="Next page"
          aria-label="Next page"
          className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
