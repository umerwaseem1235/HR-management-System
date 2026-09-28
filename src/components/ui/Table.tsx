'use client';

import React from 'react';

interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export default function Table<T extends Record<string, unknown>>({ columns, data, onRowClick, emptyMessage = 'No data found' }: TableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-[#1b263b] rounded-xl border border-medium-gray p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-[#1b263b] rounded-xl border border-medium-gray overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-blue-gray border-b border-medium-gray">
              {columns.map(col => (
                <th key={col.key} className={`px-6 py-3 text-left text-xs font-semibold text-primary dark:text-blue-gray-light uppercase tracking-wider ${col.className || ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-medium-gray">
            {data.map((item, index) => (
              <tr
                key={index}
                onClick={() => onRowClick?.(item)}
                className={`hover:bg-blue-gray dark:hover:bg-white/10/50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map(col => (
                  <td key={col.key} className={`px-6 py-4 text-sm text-dark-text dark:text-gray-100 whitespace-nowrap ${col.className || ''}`}>
                    {col.render ? col.render(item) : String(item[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
