'use client';

import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export default function Select({ label, options, error, className = '', ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-[#263238] mb-1.5">{label}</label>
      )}
      <select
        className={`w-full rounded-lg border border-[#D6E4E8] bg-white px-4 py-2.5 text-sm text-[#263238] focus:border-[#024fa7] focus:ring-2 focus:ring-[#024fa7]/20 focus:outline-none transition-colors ${error ? 'border-red-500' : ''} ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}
