'use client';

import React from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import SearchBar from '../ui/SearchBar';

interface ProgressFiltersProps {
  query: string;
  fromDate: string;
  toDate: string;
  onQueryChange: (v: string) => void;
  onFromDateChange: (v: string) => void;
  onToDateChange: (v: string) => void;
}

export default function ProgressFilters({
  query,
  fromDate,
  toDate,
  onQueryChange,
  onFromDateChange,
  onToDateChange,
}: ProgressFiltersProps) {
  return (
    <Card padding="sm">
      <div className="flex flex-col gap-3 lg:flex-row">
        <SearchBar
          value={query}
          onChange={onQueryChange}
          placeholder="Search by project name…"
          className="flex-1"
        />
        <div className="grid grid-cols-2 gap-3 lg:w-auto">
          <Input
            type="date"
            aria-label="From date"
            value={fromDate}
            onChange={(e) => onFromDateChange(e.target.value)}
          />
          <Input
            type="date"
            aria-label="To date"
            value={toDate}
            onChange={(e) => onToDateChange(e.target.value)}
          />
        </div>
      </div>
    </Card>
  );
}
