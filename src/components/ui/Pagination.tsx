'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-[#1b263b] border-t border-medium-gray">
      <p className="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Page {currentPage} of {totalPages}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-blue-gray dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-8 h-8 rounded-lg text-sm font-medium ${
              page === currentPage
                ? 'bg-teal text-white'
                : 'text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-blue-gray dark:hover:bg-white/10'
            }`}
          >
            {page}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg text-gray-500 dark:text-gray-400 dark:text-gray-500 hover:bg-blue-gray dark:hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
