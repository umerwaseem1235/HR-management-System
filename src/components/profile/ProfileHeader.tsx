'use client';

import React from 'react';

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface ProfileHeaderProps {
  displayName: string;
  badges: React.ReactNode;
  isActive: boolean;
}

export default function ProfileHeader({ displayName, badges, isActive }: ProfileHeaderProps) {
  return (
    <>
      {/* Slim gradient banner */}
      <div className="relative h-20 sm:h-24 bg-gradient-to-r from-[#17324D] via-[#024fa7] to-[#0265cc]">
        <div className="pointer-events-none absolute -top-8 right-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
      </div>
      <div className="px-5 sm:px-6 pt-0 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          <div className="relative -mt-10 sm:-mt-12 shrink-0 self-start">
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-[#17324D] text-xl sm:text-2xl font-bold text-white ring-4 ring-white shadow-xl">
              {getInitials(displayName)}
            </div>
            <span
              className={`absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full ring-4 ring-white ${
                isActive ? 'bg-green-500' : 'bg-amber-400'
              }`}
            />
          </div>
          <div className="min-w-0 sm:pb-0.5">
            <h1 className="truncate text-xl sm:text-2xl font-bold leading-tight tracking-tight text-[#17324D]">
              {displayName}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">{badges}</div>
          </div>
        </div>
      </div>
    </>
  );
}
