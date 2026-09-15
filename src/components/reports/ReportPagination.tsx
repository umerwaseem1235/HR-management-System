'use client';

import React from 'react';
import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react';
import { PAGE_SIZES } from './report-utils';

interface ReportPaginationProps {
  pageSize: number;
  onPageSizeChange: (n: number) => void;
  start: number;
  end: number;
  rowCount: number;
  safePage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}

export default function ReportPagination({
  pageSize,
  onPageSizeChange,
  start,
  end,
  rowCount,
  safePage,
  totalPages,
  onPageChange,
}: ReportPaginationProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-[#D6E4E8] bg-white px-6 py-3 sm:flex-row sm:items-center sm:justify-end">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>Records per page:</span>
        <select
          value={pageSize}
          onChange={(e) => { onPageSizeChange(Number(e.target.value)); }}
          className="rounded-lg border border-[#D6E4E8] bg-white px-2 py-1.5 text-sm text-[#263238] outline-none focus:border-[#024fa7] focus:ring-2 focus:ring-[#024fa7]/20"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <p className="text-sm text-gray-500">{start} - {end} of {rowCount}</p>
      <div className="flex items-center gap-1">
        <button type="button" disabled={safePage <= 1} onClick={() => onPageChange(1)} title="First page" className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          <ChevronsLeft size={16} />
        </button>
        <button type="button" disabled={safePage <= 1} onClick={() => onPageChange(Math.max(1, safePage - 1))} title="Previous page" className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 10).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium cursor-pointer ${p === safePage ? 'bg-[#024fa7] text-white' : 'text-gray-500 hover:bg-[#EAF2F4]'}`}
          >
            {p}
          </button>
        ))}
        <button type="button" disabled={safePage >= totalPages} onClick={() => onPageChange(Math.min(totalPages, safePage + 1))} title="Next page" className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          <ChevronRight size={16} />
        </button>
        <button type="button" disabled={safePage >= totalPages} onClick={() => onPageChange(totalPages)} title="Last page" className="p-2 rounded-lg text-gray-500 hover:bg-[#EAF2F4] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
