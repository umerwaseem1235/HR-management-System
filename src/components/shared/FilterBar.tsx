'use client';

import React from 'react';
import Card from '../ui/Card';
import SearchBar from '../ui/SearchBar';
import Select from '../ui/Select';

export interface FilterOption {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  width?: string;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  actions?: React.ReactNode;
}

/**
 * Shared search + filter bar. Replaces the repeated
 * Card > flex > SearchBar + Select blocks in every list page.
 */
export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  actions,
}: FilterBarProps) {
  return (
    <Card padding="sm">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          className="flex-1"
        />
        {filters.map((filter, i) => (
          <div key={i} className={filter.width || 'sm:w-52'}>
            <Select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              options={filter.options}
            />
          </div>
        ))}
        {actions}
      </div>
    </Card>
  );
}
