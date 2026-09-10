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
    <div
      className={`rounded-2xl border border-[#D6E4E8]/70 bg-white shadow-[0_1px_2px_rgba(23,50,77,0.05),0_10px_30px_-14px_rgba(23,50,77,0.18)] transition-all duration-300 ${paddings[padding]} ${
        hover
          ? 'cursor-pointer hover:-translate-y-1 hover:border-[#0F8B8D]/40 hover:shadow-[0_2px_4px_rgba(23,50,77,0.06),0_18px_40px_-14px_rgba(15,139,141,0.35)]'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
