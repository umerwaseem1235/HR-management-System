'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface LookupItem {
  id: string;
  name: string;
}

export interface LookupData {
  departments: LookupItem[];
  designations: LookupItem[];
  branches: LookupItem[];
  shifts: LookupItem[];
  managers: LookupItem[];
}

/**
 * Lookup fetch + create-employee POST for the /employees/new page.
 * Extracted from the page so the route stays a thin composition layer.
 */
export function useEmployeeCreate() {
  const router = useRouter();
  const close = useCallback(() => router.push('/employees'), [router]);
  const [lookupData, setLookupData] = useState<LookupData | null>(null);
  const [isLookupLoading, setIsLookupLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/employees/lookup');
        if (!res.ok) throw new Error('Failed to load form data');
        if (!cancelled) setLookupData(await res.json());
      } catch (err) {
        if (!cancelled) setSubmitError(err instanceof Error ? err.message : 'Failed to load form data');
      } finally {
        if (!cancelled) setIsLookupLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = useCallback(
    async (values: Record<string, string>, photo: string | null) => {
      setSubmitError(null);
      setIsSubmitting(true);
      try {
        const res = await fetch('/api/employees', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...values, avatar: photo }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to create employee');
        }
        router.push('/employees');
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : 'Failed to create employee');
      } finally {
        setIsSubmitting(false);
      }
    },
    [router],
  );

  return {
    close,
    lookupData,
    isLookupLoading,
    isSubmitting,
    submitError,
    handleSave,
  };
}

export type UseEmployeeCreateReturn = ReturnType<typeof useEmployeeCreate>;
