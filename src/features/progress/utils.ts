// Canonical text/date helpers live in @/utils — re-exported here so existing
// `from '@/features/progress'` imports keep working.
export { stripHtml, noteStats } from '@/utils/text';
export { MONTHS_SHORT as MONTHS, formatDayMonYear as formatSubmission } from '@/utils/date';
export { PAGE_SIZE_OPTIONS as PAGE_SIZES } from '@/utils/pagination';
