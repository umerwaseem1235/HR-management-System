/**
 * Tiny client-side cache for expensive read-only server-action queries.
 *
 * Why: switching modules re-mounts feature views and re-fires full data
 * loads. Repeat visits within the TTL resolve instantly with zero Supabase
 * round-trips, and concurrent callers share one inflight request instead of
 * stampeding the database. Mutations explicitly invalidate their keys so
 * writes are always reflected immediately.
 */

const DEFAULT_TTL_MS = 45_000;

interface CacheEntry {
  data: unknown;
  ts: number;
}

const store = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

/** Read through the cache: fresh TTL hit or shared inflight request wins. */
export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<T> {
  const hit = store.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) {
    return hit.data as T;
  }
  const ongoing = inflight.get(key);
  if (ongoing) {
    return ongoing as Promise<T>;
  }
  const p = fetcher().then(
    (data) => {
      store.set(key, { data, ts: Date.now() });
      inflight.delete(key);
      return data;
    },
    (err) => {
      inflight.delete(key);
      throw err;
    },
  );
  inflight.set(key, p);
  return p;
}

/** Synchronous peek for instant first paint (undefined = no fresh entry). */
export function peekQuery<T>(key: string, ttlMs: number = DEFAULT_TTL_MS): T | undefined {
  const hit = store.get(key);
  if (hit && Date.now() - hit.ts < ttlMs) {
    return hit.data as T;
  }
  return undefined;
}

/**
 * Synchronous peek that ignores TTL (stale-while-revalidate paint).
 * Returns any stored entry so remounted views can paint immediately with
 * last-known data while `cachedQuery` revalidates in the background.
 * A stored `null` is returned as `null`; only a missing entry is `undefined`.
 */
export function peekStaleQuery<T>(key: string): T | undefined {
  const hit = store.get(key);
  return hit ? (hit.data as T) : undefined;
}

/** Write a fresh entry — e.g. after a mutation, so the next mount is instant. */
export function primeQuery<T>(key: string, data: T): void {
  inflight.delete(key);
  store.set(key, { data, ts: Date.now() });
}

/** Drop a cached entry — call after any mutation that affects it. */
export function invalidateQuery(key: string): void {
  store.delete(key);
}
