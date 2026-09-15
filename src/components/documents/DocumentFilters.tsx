'use client';

import React from 'react';
import Card from '../ui/Card';
import SearchBar from '../ui/SearchBar';

interface DocumentFiltersProps {
  search: string;
  category: string;
  categories: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (category: string) => void;
}

export default function DocumentFilters({ search, category, categories, onSearchChange, onCategoryChange }: DocumentFiltersProps) {
  return (
    <Card padding="sm">
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={onSearchChange} placeholder="Search documents..." className="flex-1" />
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => onCategoryChange(cat)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${category === cat ? 'bg-[#024fa7] text-white' : 'bg-[#EAF2F4] text-[#263238] hover:bg-[#D6E4E8]'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>
    </Card>
  );
}
