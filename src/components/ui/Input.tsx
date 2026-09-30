'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, icon, className = '', type, ...props }, ref) => {
  // Native date/time pickers need 16px text on mobile (smaller sizes trigger
  // iOS auto-zoom on focus) + a matching color-scheme so the calendar icon
  // and picker render correctly in both light and dark mode.
  const isDateLike =
    type === 'date' || type === 'time' || type === 'month' || type === 'week' || type === 'datetime-local';
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-dark-text dark:text-gray-100 mb-1.5">{label}</label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-medium-gray">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={`w-full rounded-lg border border-medium-gray bg-white dark:bg-[#1b263b] px-4 py-2.5 text-dark-text dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none transition-colors ${isDateLike ? 'min-h-[44px] text-base sm:text-sm [color-scheme:light] dark:[color-scheme:dark]' : 'text-sm'} ${icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
