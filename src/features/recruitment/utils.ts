/** Today's date as YYYY-MM-DD (UTC slice — preserves existing behavior). */
export const today = (): string => new Date().toISOString().slice(0, 10);

/** Storage paths are `<timestamp>_<original name>` — show only the original name. */
export const cvDisplayName = (path?: string | null): string =>
  !path ? '' : path.split('/').pop()?.replace(/^\d+_/, '') || path;
