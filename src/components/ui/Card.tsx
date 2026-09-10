'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  elevated?: boolean;
}

// One shared premium motion language: slow, single ease-out curve
const EASE = '[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]';
const SLOW = '[transition-duration:1000ms]';

export default function Card({ 
  children, 
  className = '', 
  padding = 'md', 
  hover = false,
  elevated = false
}: CardProps) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={`relative rounded-2xl border border-[#D6E4E8]/70 bg-white ${paddings[padding]} ${SLOW} ${EASE} [transition-property:transform,border-color] ${
        elevated
          ? 'shadow-[0_2px_4px_rgba(23,50,77,0.06),0_12px_40px_-12px_rgba(23,50,77,0.2)]'
          : 'shadow-[0_1px_2px_rgba(23,50,77,0.05),0_10px_30px_-14px_rgba(23,50,77,0.18)]'
      } ${
        hover
          ? 'group cursor-pointer hover:-translate-y-2 hover:border-[#0F8B8D]/40 hover:will-change-transform'
          : ''
      } ${className}`}
    >
      {hover && (
        <>
          {/* Hover shadow layer — faded via opacity (GPU cheap) instead of animating box-shadow */}
          <div className={`pointer-events-none absolute inset-0 rounded-2xl opacity-0 shadow-[0_8px_20px_rgba(23,50,77,0.1),0_24px_60px_-16px_rgba(15,139,141,0.3)] group-hover:opacity-100 ${SLOW} ${EASE} [transition-property:opacity]`} />
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0F8B8D]/5 via-transparent to-transparent rounded-2xl opacity-0 group-hover:opacity-100 ${SLOW} [transition-property:opacity]`} />
        </>
      )}
      {children}
    </div>
  );
}
