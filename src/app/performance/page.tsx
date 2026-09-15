'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy route — Performance was replaced by the Progress module. */
export default function LegacyPerformanceRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/progress');
  }, [router]);
  return null;
}
