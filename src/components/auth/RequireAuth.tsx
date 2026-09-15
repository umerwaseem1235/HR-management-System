'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Redirects to /login when there is no authenticated session
 * (logout, expired/cleared session, direct URL access).
 *
 * Must be called unconditionally on every render, BEFORE any
 * `if (!user) return ...` early return, so the redirect fires even
 * on pages that render nothing for guests.
 */
export function useRequireAuth() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login');
    }
  }, [user, isLoading, router]);
}

/**
 * Branded full-screen fallback shown while the redirect above runs,
 * so users never stare at a blank screen after logout.
 */
export function AuthLoadingFallback({ message = 'Redirecting to login...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EAF2F4]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#024fa7] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#17324D] font-medium">{message}</p>
      </div>
    </div>
  );
}
