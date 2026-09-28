'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-blue-gray text-primary dark:text-blue-gray-light',
    success: 'bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400',
    warning: 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400',
    danger: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400',
    info: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400',
    neutral: 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
