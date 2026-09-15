'use client';

import React from 'react';
import { FilterBar } from '@/components/shared';
import { DEPARTMENTS } from '@/lib/constants';

interface EmployeeFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  deptFilter: string;
  onDeptFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export default function EmployeeFilters({
  search,
  onSearchChange,
  deptFilter,
  onDeptFilterChange,
  statusFilter,
  onStatusFilterChange,
}: EmployeeFiltersProps) {
  return (
    <FilterBar
      searchValue={search}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by name or ID"
      filters={[
        {
          value: deptFilter,
          onChange: onDeptFilterChange,
          width: 'sm:w-52',
          options: [
            { value: '', label: 'All Departments' },
            ...DEPARTMENTS.map(d => ({ value: d, label: d })),
          ],
        },
        {
          value: statusFilter,
          onChange: onStatusFilterChange,
          width: 'sm:w-44',
          options: [
            { value: '', label: 'All Status' },
            { value: 'Active', label: 'Active' },
            { value: 'Inactive', label: 'Inactive' },
            { value: 'Probation', label: 'Probation' },
            { value: 'On Notice', label: 'On Notice' },
          ],
        },
      ]}
    />
  );
}
