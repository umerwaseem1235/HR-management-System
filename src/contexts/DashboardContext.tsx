'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import { getDashboardData, type DashboardData } from '@/lib/actions/dashboard';

interface DashboardContextType {
  /** Latest dashboard payload, or `null` before the first load resolves. */
  data: DashboardData | null;
  /** `true` while a fetch is in flight. */
  isLoading: boolean;
  /** User-facing error message when the most recent fetch failed. */
  error: string | null;
  /** Starts the first load if it hasn't run yet. Safe to call on every mount. */
  ensureLoaded: () => void;
  /** Forces a fresh fetch (e.g. after a mutation) and resolves when done. */
  refresh: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

/** How long a session-cached snapshot stays fresh enough to paint before revalidating. */
const CACHE_TTL_MS = 5 * 60 * 1000;
const cacheKey = (userId: string) => `codqor:dashboard:${userId}`;

function readCache(userId: string): DashboardData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(cacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data: DashboardData; savedAt: number };
    if (!parsed?.data || Date.now() - parsed.savedAt > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache(userId: string, data: DashboardData): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(cacheKey(userId), JSON.stringify({ data, savedAt: Date.now() }));
  } catch {
    // Storage full/unavailable — in-memory state still serves the session.
  }
}

/**
 * App-wide cache for the admin/HR dashboard.
 *
 * Lives above the routes (alongside the other domain contexts), so the data
 * survives client-side navigation. Switching modules and returning to the
 * dashboard renders instantly from memory instead of re-running the whole
 * server action. A session snapshot additionally makes a full page reload
 * paint immediately while a background refresh runs (stale-while-revalidate).
 */
export function DashboardProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.id ?? '';
  const canLoad = !!userId && (user?.role === 'super_admin' || user?.role === 'hr_manager');

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedForRef = useRef<string | null>(null);
  const inFlightRef = useRef<Promise<void> | null>(null);
  const dataRef = useRef<DashboardData | null>(null);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const load = useCallback(async (uid: string, force = false, silent = false): Promise<void> => {
    if (!uid) return;
    if (!force && loadedForRef.current === uid) return;
    if (inFlightRef.current) return inFlightRef.current;

    loadedForRef.current = uid;
    // Silent background revalidation (SWR) must never flip the spinner when
    // we already have data to show — otherwise returning to the dashboard
    // flashes loaders even though the paint was instant.
    const showSpinner = !silent || !dataRef.current;
    if (showSpinner) setIsLoading(true);
    setError(null);

    const run = (async () => {
      try {
        const next = await getDashboardData();
        setData(next);
        writeCache(uid, next);
      } catch (err) {
        // Allow a retry on the next ensureLoaded()/refresh().
        loadedForRef.current = null;
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = run;
    return run;
  }, []);

  useEffect(() => {
    if (authLoading) return;

    if (!canLoad) {
      if (!userId) {
        // Signed out: drop any cached admin data from memory.
        loadedForRef.current = null;
        const id = setTimeout(() => {
          setData(null);
          setError(null);
        }, 0);
        return () => clearTimeout(id);
      }
      return;
    }

    const cached = readCache(userId);
    if (cached) {
      // Paint the cached snapshot immediately, then revalidate silently in
      // the background. `silent` keeps isLoading false so switching modules
      // and coming back never flashes a loader — the numbers stay visible
      // and converge when the fresh payload arrives.
      // Mark as loaded synchronously so ensureLoaded() from a remount does
      // not fire a second competing fetch before the SWR completes.
      loadedForRef.current = userId;
      const id = setTimeout(() => setData(cached), 0);
      void load(userId, true, true);
      return () => clearTimeout(id);
    }

    void load(userId);
  }, [authLoading, canLoad, userId, load]);

  const ensureLoaded = useCallback(() => {
    if (canLoad && userId && loadedForRef.current !== userId && !inFlightRef.current) {
      void load(userId);
    }
  }, [canLoad, userId, load]);

  const refresh = useCallback(async () => {
    if (canLoad && userId) await load(userId, true);
  }, [canLoad, userId, load]);

  const value = useMemo(
    () => ({ data, isLoading, error, ensureLoaded, refresh }),
    [data, isLoading, error, ensureLoaded, refresh],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}