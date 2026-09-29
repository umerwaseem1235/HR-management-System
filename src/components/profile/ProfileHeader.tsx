'use client';

import NextImage from 'next/image';
import React from 'react';
import { getInitials } from '@/utils';

interface ProfileHeaderProps {
  displayName: string;
  avatarUrl?: string;
  badges: React.ReactNode;
  isActive: boolean;
}

export default function ProfileHeader({ displayName, avatarUrl, badges, isActive }: ProfileHeaderProps) {
  // Track the exact src that failed. Deriving "show photo" from it means a new
  // or replaced photo (different src) automatically retries — no effect needed.
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);

  return (
    <>
      {/* Slim gradient banner */}
      <div className="relative h-20 sm:h-24 bg-gradient-to-r from-primary via-teal to-teal-light">
        <div className="pointer-events-none absolute -top-8 right-8 h-28 w-28 rounded-full bg-white dark:bg-[#1b263b]/10 blur-2xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-20 w-20 rounded-full bg-white dark:bg-[#1b263b]/10 blur-2xl" />
      </div>
      <div className="px-5 sm:px-6 pt-0 pb-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4">
          <div className="relative -mt-10 sm:-mt-12 shrink-0 self-start">
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center overflow-hidden rounded-full bg-primary text-xl sm:text-2xl font-bold text-white ring-4 ring-white dark:ring-[#1b263b] shadow-xl">
              {!avatarUrl || failedSrc === avatarUrl ? (
                getInitials(displayName)
              ) : /^(data:|blob:)/.test(avatarUrl) ? (
                // Uploaded photos are base64/blob URLs — next/image handles
                // these unreliably (falls back to initials), so render them
                // with a plain <img>, same as the shared Avatar component.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  width={96}
                  height={96}
                  onError={() => setFailedSrc(avatarUrl)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <NextImage
                  src={avatarUrl}
                  alt={displayName}
                  width={96}
                  height={96}
                  unoptimized
                  loader={({ src }) => src}
                  onError={() => setFailedSrc(avatarUrl)}
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <span
              className={`absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full ring-4 ring-white dark:ring-[#1b263b] ${
                isActive ? 'bg-green-50 dark:bg-green-950/300' : 'bg-amber-400'
              }`}
            />
          </div>
          <div className="min-w-0 sm:pb-0.5">
            <h1 className="truncate text-xl sm:text-2xl font-bold leading-tight tracking-tight text-primary dark:text-blue-gray-light">
              {displayName}
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">{badges}</div>
          </div>
        </div>
      </div>
    </>
  );
}
