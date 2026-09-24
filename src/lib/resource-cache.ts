/**
 * Tiny in-memory, stale-while-revalidate cache for server-action data.
 *
 * Module scope outlives client-side navigation, so feature views that remount
 * when switching modules can paint instantly from the previous result instead
 * of re-running their loader. A TTL decides when a background revalidation
 * happens; the (possibly stale) snapshot is always served immediately, so the
 * user never waits behind a spinner just because they left and came back.
 *
 * Concurrent callers share one in-flight request, and every entry is cleared
 * on sign-out (see {@link clearAllResourceCaches}) so data never leaks across
 * users sharing a browser tab.
 */

interface CacheEntry<T> {
  data: T;
  savedAt: number;
}

export interface CachedSnapshot<T> {
  data: T;
  /** `true` when the snapshot is older than the resource TTL. */
  isStale: boolean;
}

export interface ResourceCache<T> {
  /** Current snapshot without triggering a fetch (`null` when empty). */
  peek(): CachedSnapshot<T> | null;
  /** Stored data without the TTL wrapper (`null` when empty). */
  get(): T | null;
  /**
   * Returns data, fetching when the cache is empty, stale, or `force` is set.
   * Concurrent callers share a single request.
   */
  load(fetcher: () => Promise<T>, options?: { force?: boolean }): Promise<T>;
  /** Overwrites the entry with fresh data (after a mutation/optimistic update). */
  set(data: T): void;
  /** Drops the entry so the next load fetches again. */
  invalidate(): void;
}

const store = new Map<string, CacheEntry<unknown>>();
const pending = new Map<string, Promise<unknown>>();

export function createResourceCache<T>(key: string, ttlMs: number): ResourceCache<T> {
  return {
    peek() {
      const entry = store.get(key) as CacheEntry<T> | undefined;
      if (!entry) return null;
      return { data: entry.data, isStale: Date.now() - entry.savedAt > ttlMs };
    },

    get() {
      const entry = store.get(key) as CacheEntry<T> | undefined;
      return entry ? entry.data : null;
    },

    load(fetcher, options) {
      const existing = pending.get(key) as Promise<T> | undefined;
      if (existing) return existing;

      const entry = store.get(key) as CacheEntry<T> | undefined;
      if (!options?.force && entry && Date.now() - entry.savedAt <= ttlMs) {
        return Promise.resolve(entry.data);
      }

      const request = fetcher().then(
        (data) => {
          store.set(key, { data, savedAt: Date.now() });
          pending.delete(key);
          return data;
        },
        (error) => {
          pending.delete(key);
          throw error;
        },
      );
      pending.set(key, request);
      return request;
    },

    set(data) {
      store.set(key, { data, savedAt: Date.now() });
    },

    invalidate() {
      store.delete(key);
      pending.delete(key);
    },
  };
}

/** Clears every cache entry — call on sign-out so data never leaks across users. */
export function clearAllResourceCaches(): void {
  store.clear();
  pending.clear();
}