'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-gray">
      <div className="animate-pulse">
        <div className="text-2xl font-bold text-primary">CodeQor HRMS</div>
        <div className="text-sm text-dark-text mt-2">Loading...</div>
      </div>
    </div>
  );
}
