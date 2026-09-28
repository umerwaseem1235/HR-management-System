'use client';

import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  size?: 'md' | 'lg';
  onFocus?: () => void;
  onBlur?: () => void;
}

export default function SearchBar({ value, onChange, placeholder = 'Search...', className = '', size = 'md', onFocus, onBlur }: SearchBarProps) {
  const inputSize = size === 'lg' ? 'pl-11 pr-5 py-3.5 text-[15px]' : 'pl-10 pr-4 py-2.5 text-sm';
  return (
    <div className={`relative ${className}`}>
      <Search size={size === 'lg' ? 20 : 18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full ${inputSize} rounded-xl border border-medium-gray bg-white dark:bg-[#1b263b] text-dark-text dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none transition-all`}
      />
    </div>
  );
}
