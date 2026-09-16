import { useEffect, useState } from 'react';

/**
 * Debounced search state.
 *
 * `query` updates instantly (bind to the input); `debouncedQuery` follows
 * after `delayMs` of inactivity (use for filtering/fetching). Adoption is
 * opt-in — no existing page was migrated to it.
 */

export interface DebouncedSearch {
  /** Raw input value — bind to the search field. */
  query: string;
  /** Debounced value — use for filtering or fetching. */
  debouncedQuery: string;
  setQuery: (value: string) => void;
  clear: () => void;
}

/**
 * @example
 * const { query, debouncedQuery, setQuery } = useDebouncedSearch('', 300);
 * const rows = useMemo(() => filter(all, debouncedQuery), [all, debouncedQuery]);
 */
export function useDebouncedSearch(initialValue = '', delayMs = 300): DebouncedSearch {
  const [query, setQuery] = useState(initialValue);
  const [debouncedQuery, setDebouncedQuery] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), delayMs);
    return () => clearTimeout(timer);
  }, [query, delayMs]);

  return {
    query,
    debouncedQuery,
    setQuery,
    clear: () => setQuery(''),
  };
}

/** Alias kept short for call sites that prefer `useSearch`. */
export const useSearch = useDebouncedSearch;
export type SearchState = DebouncedSearch;
