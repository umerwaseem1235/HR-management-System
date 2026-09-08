'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export default function Card({ children, className = '', padding = 'md', hover = false }: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div className={`bg-white rounded-xl border border-[#D6E4E8] shadow-sm ${paddings[padding]} ${hover ? 'hover:shadow-md hover:border-[#0F8B8D]/30 cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
  );
}
