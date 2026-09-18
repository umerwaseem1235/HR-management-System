'use client';

import React from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Select from '../ui/Select';
import SearchBar from '../ui/SearchBar';
import { STATUS_OPTIONS } from './remote-utils';

interface RemoteFiltersProps {
  isEmployee: boolean;
  search: string;
  fromFilter: string;
  toFilter: string;
  dateFilter: string;
  deptFilter: string;
  statusFilter: string;
  deptOptions: { value: string; label: string }[];
  onSearchChange: (v: string) => void;
  onFromFilterChange: (v: string) => void;
  onToFilterChange: (v: string) => void;
  onDateFilterChange: (v: string) => void;
  onDeptFilterChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
}

export default function RemoteFilters({
  isEmployee,
  search,
  fromFilter,
  toFilter,
  dateFilter,
  deptFilter,
  statusFilter,
  deptOptions,
  onSearchChange,
  onFromFilterChange,
  onToFilterChange,
  onDateFilterChange,
  onDeptFilterChange,
  onStatusFilterChange,
}: RemoteFiltersProps) {
  return (
    <Card padding="sm">
      {isEmployee ? (
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="grid grid-cols-2 gap-3 flex-1">
            <Input label="From" type="date" value={fromFilter} onChange={(e) => onFromFilterChange(e.target.value)} />
            <Input label="To" type="date" value={toFilter} onChange={(e) => onToFilterChange(e.target.value)} />
          </div>
          <div className="lg:w-52 shrink-0 lg:ml-auto">
            <Select label="Status" value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} options={STATUS_OPTIONS} />
          </div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
          <div className="flex-1 min-w-0">
            <SearchBar value={search} onChange={(v) => onSearchChange(v)} placeholder="Search employee, reason or date..." />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 lg:w-auto">
            <Input label="Date" type="date" value={dateFilter} onChange={(e) => onDateFilterChange(e.target.value)} />
            <Select label="Department" value={deptFilter} onChange={(e) => onDeptFilterChange(e.target.value)} options={deptOptions} />
            <Select label="Status" value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} options={STATUS_OPTIONS} />
          </div>
        </div>
      )}
    </Card>
  );
}
