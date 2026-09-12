'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  elevated?: boolean;
}

export default function Card({ 
  children, 
  className = '', 
  padding = 'md', 
  hover = false,
  elevated = false
}: CardProps) {
  const paddings = {
    none: '',
    xs: 'p-2.5',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`relative rounded-2xl border border-[#D6E4E8]/70 bg-white ${paddings[padding]} card-hover ${
        elevated
          ? 'shadow-[0_2px_4px_rgba(23,50,77,0.06),0_12px_40px_-12px_rgba(23,50,77,0.2)]'
          : 'shadow-[0_1px_2px_rgba(23,50,77,0.05),0_10px_30px_-14px_rgba(23,50,77,0.18)]'
      } ${
        hover
          ? 'group cursor-pointer card-hover-strong'
          : ''
      } ${className}`}
    >
      {hover && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-[#024fa7]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 card-hover-fade" />
      )}
      {children}
    </div>
  );
}
