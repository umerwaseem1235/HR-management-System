import { useMemo, useState } from 'react';

/**
 * Generic client-side pagination state.
 *
 * Encapsulates the page/pageSize/total-pages math repeated across report and
 * list pages (see `app/reports/page.tsx`). Pure state + memo — no behavior
 * opinions beyond clamping to valid pages and resetting to page 1 on
 * page-size change.
 */

export interface PaginationControls {
  /** Current (1-based) requested page. */
  page: number;
  /** Rows per page. */
  pageSize: number;
  /** Total pages, always >= 1 (even when empty, mirrors existing pages). */
  totalPages: number;
  /** `page` clamped into `[1, totalPages]`. Slice with this. */
  safePage: number;
  /** 1-based index of the first row on the current page (0 when empty). */
  start: number;
  /** 1-based index of the last row on the current page (0 when empty). */
  end: number;
  /** Total row count. */
  total: number;
  setPage: (page: number) => void;
  /** Sets the size and resets to page 1. */
  setPageSize: (size: number) => void;
  /** Back to page 1 (e.g. after filters/search change). */
  resetPage: () => void;
}

export interface PaginatedResult<T> extends PaginationControls {
  /** Rows for the current page. */
  pageItems: T[];
}

/**
 * Paginate any in-memory list.
 *
 * @example
 * const { pageItems, safePage, totalPages, setPage, setPageSize } =
 *   usePagination(filteredRows, 10);
 */
export function usePagination<T>(items: readonly T[], initialPageSize = 10): PaginatedResult<T> {
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  return useMemo<PaginatedResult<T>>(() => {
    const total = items.length;
    const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
    const end = Math.min(safePage * pageSize, total);
    const pageItems = items.slice((safePage - 1) * pageSize, safePage * pageSize);
    return {
      page,
      pageSize,
      totalPages,
      safePage,
      start,
      end,
      total,
      pageItems,
      setPage: (p: number) => setPageState(p),
      setPageSize: (size: number) => {
        setPageSizeState(size);
        setPageState(1);
      },
      resetPage: () => setPageState(1),
    };
  }, [items, page, pageSize]);
}
