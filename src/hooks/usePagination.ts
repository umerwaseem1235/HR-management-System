'use client';

import { useMemo, useState } from 'react';

interface PaginationResult<T> {
  page: number;
  totalPages: number;
  pageItems: T[];
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
}

/** Client-side pagination over an already-filtered list. */
export function usePagination<T>(items: T[], pageSize = 10): PaginationResult<T> {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => items.slice((safePage - 1) * pageSize, safePage * pageSize),
    [items, safePage, pageSize],
  );

  return {
    page: safePage,
    totalPages,
    pageItems,
    setPage: (p) => setPage(Math.min(Math.max(1, p), totalPages)),
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(1, p - 1)),
  };
}
