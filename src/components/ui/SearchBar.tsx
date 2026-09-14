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
      <Search size={size === 'lg' ? 20 : 18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full ${inputSize} rounded-xl border border-[#D6E4E8] bg-white text-[#263238] placeholder-gray-400 focus:border-[#024fa7] focus:ring-2 focus:ring-[#024fa7]/20 focus:outline-none transition-all`}
      />
    </div>
  );
}
