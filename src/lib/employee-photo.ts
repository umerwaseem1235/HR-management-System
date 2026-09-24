/**
 * Employee profile-photo constraints — the single source of truth shared by
 * the client form (pre-upload validation) and the server actions (defence in
 * depth). Keep both sides in sync by importing from here, never re-typing
 * the limit.
 */

/** Maximum size of an employee profile photo: 1 MB. */
export const EMPLOYEE_PHOTO_MAX_BYTES = 1 * 1024 * 1024;

/** Human-readable form of {@link EMPLOYEE_PHOTO_MAX_BYTES}, for messages/UI. */
export const EMPLOYEE_PHOTO_MAX_LABEL = '1 MB';

/** Image formats accepted by the employee form. */
export const EMPLOYEE_PHOTO_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const;

/** Value for an `<input type="file" accept="...">`. */
export const EMPLOYEE_PHOTO_ACCEPT = EMPLOYEE_PHOTO_MIME_TYPES.join(',');

/** Formats a byte count for humans, e.g. `1.2 MB`, `340 KB`. */
export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 || value >= 10 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
}

/** True when `value` is a base64 image data URL (`data:image/...;base64,...`). */
export function isImageDataUrl(value: string): boolean {
  return /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);
}

/** Decoded byte length of a base64 data-URL payload (not the string length). */
export function dataUrlByteSize(dataUrl: string): number {
  const comma = dataUrl.indexOf(',');
  if (comma === -1) return 0;
  const base64 = dataUrl.slice(comma + 1).replace(/\s/g, '');
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}

/**
 * Validates a file selected in the form.
 * Returns a user-facing error message, or `null` when the file is acceptable.
 */
export function validateEmployeePhotoFile(file: File): string | null {
  if (file.size === 0) {
    return 'The selected file is empty. Please choose another image.';
  }
  if (!(EMPLOYEE_PHOTO_MIME_TYPES as readonly string[]).includes(file.type)) {
    return 'Please choose a PNG, JPG or WEBP image.';
  }
  if (file.size > EMPLOYEE_PHOTO_MAX_BYTES) {
    return `Profile photo must be ${EMPLOYEE_PHOTO_MAX_LABEL} or smaller. The selected image is ${formatBytes(file.size)}.`;
  }
  return null;
}

/**
 * Server-side guard for the stored value. Only the base64 payloads we control
 * are measured — external URLs are left untouched. Returns an error message or
 * `null` when acceptable.
 */
export function validateEmployeePhotoPayload(avatar: string | null | undefined): string | null {
  if (!avatar || !isImageDataUrl(avatar)) return null;
  const bytes = dataUrlByteSize(avatar);
  if (bytes > EMPLOYEE_PHOTO_MAX_BYTES) {
    return `Profile photo must be ${EMPLOYEE_PHOTO_MAX_LABEL} or smaller (received ${formatBytes(bytes)}).`;
  }
  return null;
}