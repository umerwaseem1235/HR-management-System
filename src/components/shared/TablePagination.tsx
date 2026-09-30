'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Select from '../ui/Select';

/** Default page size everywhere: 10 rows, then next page. */
export const TABLE_PAGE_SIZES = [10, 20, 50] as const;

function pageNumbers(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const window = [page - 1, page, page + 1].filter((p) => p > 1 && p < totalPages);
  const pages: (number | '…')[] = [1];
  if (window.length > 0 && window[0] > 2) pages.push('…');
  pages.push(...window);
  if (window.length > 0 && window[window.length - 1] < totalPages - 1) pages.push('…');
  if (window.length === 0) pages.push('…');
  pages.push(totalPages);
  return pages;
}

const navBtn =
  'p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-blue-gray dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';

/**
 * Professional table footer used across every module:
 * "Showing X–Y of Z" + records-per-page + First/Prev/numbers/Next/Last.
 * Renders nothing when there are no rows (the table's EmptyState covers it).
 */
export default function TablePagination({
  page,
  totalPages,
  totalCount,
  start,
  end,
  perPage,
  onPageChange,
  onPerPageChange,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  start: number;
  end: number;
  perPage: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}) {
  // Single page (e.g. only 1 record) needs no pagination — hide the whole
  // footer instead of showing "Records per page / 1–1 of 1" with dead buttons.
  if (totalCount === 0 || totalPages <= 1) return null;
  return (
    <div className="flex flex-col gap-3 border-t border-medium-gray bg-white dark:bg-[#1b263b] px-6 py-3 sm:flex-row sm:items-center sm:justify-end">
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span className="whitespace-nowrap">Records per page:</span>
        <div className="w-[76px] shrink-0">
          <Select
            size="sm"
            ariaLabel="Records per page"
            value={String(perPage)}
            onChange={(e) => onPerPageChange(Number(e.target.value))}
            options={TABLE_PAGE_SIZES.map((s) => ({ value: String(s), label: String(s) }))}
          />
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
        Showing {start}–{end} of {totalCount}
      </p>
      <div className="flex items-center gap-1">
        <button type="button" disabled={page <= 1} onClick={() => onPageChange(1)} title="First page" aria-label="First page" className={navBtn}>
          <ChevronsLeft size={16} />
        </button>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          title="Previous page"
          aria-label="Previous page"
          className={navBtn}
        >
          <ChevronLeft size={16} />
        </button>
        {pageNumbers(page, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-gray-400 dark:text-gray-500">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-label={`Page ${p}`}
              aria-current={p === page ? 'page' : undefined}
              className={`min-w-8 h-8 px-1.5 rounded-lg text-sm font-medium cursor-pointer ${
                p === page ? 'bg-teal text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-blue-gray dark:hover:bg-white/10'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          title="Next page"
          aria-label="Next page"
          className={navBtn}
        >
          <ChevronRight size={16} />
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title="Last page"
          aria-label="Last page"
          className={navBtn}
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
