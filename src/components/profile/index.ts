export { default as ProfileHeader } from './ProfileHeader';
// Backwards-compat: getInitials now lives in @/utils — re-exported so existing
// `from '@/components/profile'` imports keep working.
export { getInitials } from '@/utils';
export { default as ProfileInfo, FieldRow } from './ProfileInfo';
