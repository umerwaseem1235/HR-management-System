'use client';

import React from 'react';
import Card from '../ui/Card';
import SearchBar from '../ui/SearchBar';
import Select from '../ui/Select';
import { DEPARTMENTS } from '../../lib/constants';

interface EmployeeFiltersProps {
  search: string;
  searchFocused: boolean;
  deptFilter: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onClearSearch: () => void;
  onDeptChange: (value: string) => void;
  onStatusChange: (value: string) => void;
}

export default function EmployeeFilters({
  search,
  searchFocused,
  deptFilter,
  statusFilter,
  onSearchChange,
  onSearchFocus,
  onSearchBlur,
  onClearSearch,
  onDeptChange,
  onStatusChange,
}: EmployeeFiltersProps) {
  return (
    <Card padding="sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          onFocus={onSearchFocus}
          onBlur={onSearchBlur}
          placeholder="Search by name or ID"
          className="flex-1 transition-all duration-300"
          size="lg"
        />
        {searchFocused && (
          <button
            type="button"
            onMouseDown={e => e.preventDefault()}
            onClick={onClearSearch}
            title="Show filters"
            className="shrink-0 rounded-xl border border-[#D6E4E8] px-4 py-3.5 text-sm font-medium text-[#024fa7] hover:bg-[#EAF2F4] cursor-pointer whitespace-nowrap"
          >
            Show filters
          </button>
        )}
        <div className={`grid gap-3 transition-all duration-300 overflow-hidden ${searchFocused ? 'grid-rows-[0fr] opacity-0 sm:hidden' : 'grid-rows-[1fr] opacity-100'}`}>
          <div className="flex flex-col sm:flex-row gap-3 min-h-0">
            <div className="sm:w-52">
              <Select
                value={deptFilter}
                onChange={(e) => onDeptChange(e.target.value)}
                options={[
                  { value: '', label: 'All Departments' },
                  ...DEPARTMENTS.map(d => ({ value: d, label: d })),
                ]}
              />
            </div>
            <div className="sm:w-44">
              <Select
                value={statusFilter}
                onChange={(e) => onStatusChange(e.target.value)}
                options={[
                  { value: '', label: 'All Status' },
                  { value: 'Active', label: 'Active' },
                  { value: 'Inactive', label: 'Inactive' },
                  { value: 'Probation', label: 'Probation' },
                  { value: 'On Notice', label: 'On Notice' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
