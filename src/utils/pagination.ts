/** Shared page-size options for all tables (keeps <Select> shapes consistent). */
export const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

export interface PageSlice<T> {
  totalPages: number;
  safePage: number;
  start: number;
  end: number;
  rows: T[];
}

/**
 * Single canonical client-side pagination helper.
 * Replaces the copy-pasted totalPages/safePage/slice blocks in
 * useProgressView / useReports / useRemoteView.
 */
export function paginate<T>(items: T[], page: number, pageSize: number): PageSlice<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / Math.max(1, pageSize)));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = items.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = Math.min(safePage * pageSize, items.length);
  const rows = items.slice((safePage - 1) * pageSize, safePage * pageSize);
  return { totalPages, safePage, start, end, rows };
}
