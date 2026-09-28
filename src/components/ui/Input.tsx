'use client';

import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, icon, className = '', ...props }, ref) => {
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
          className={`w-full rounded-lg border border-medium-gray bg-white dark:bg-[#1b263b] px-4 py-2.5 text-sm text-dark-text dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-teal focus:ring-2 focus:ring-teal/20 focus:outline-none transition-colors ${icon ? 'pl-10' : ''} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
