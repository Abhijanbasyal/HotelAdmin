import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns';

/**
 * Format a date to a human-readable display string.
 * @example formatDate('2024-06-15') → 'Jun 15, 2024'
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, 'MMM d, yyyy');
}

/**
 * Format a date with time.
 * @example formatDateTime('2024-06-15T14:30:00Z') → 'Jun 15, 2024, 2:30 PM'
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return format(d, 'MMM d, yyyy, h:mm a');
}

/**
 * Human-readable relative time.
 * @example formatRelative('2024-06-10') → '5 days ago'
 */
export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) return 'Invalid date';
  return formatDistanceToNow(d, { addSuffix: true });
}

/**
 * Format a number as currency.
 * @example formatCurrency(1234.5) → '$1,234.50'
 */
export function formatCurrency(
  value: number | null | undefined,
  currency = 'USD',
  locale = 'en-US'
): string {
  if (value == null) return '—';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number with thousands separators.
 * @example formatNumber(1234567) → '1,234,567'
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format file size in human-readable form.
 * @example formatFileSize(1048576) → '1.0 MB'
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

/**
 * Truncate a string to a maximum length with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Generate initials from a full name.
 * @example getInitials('Jane Doe') → 'JD'
 */
export function getInitials(name: string, fallback = '?'): string {
  const trimmed = name.trim();
  if (!trimmed) return fallback;
  return trimmed
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Safe display of a value that may be null or undefined.
 */
export function displayValue(value: string | number | null | undefined, fallback = '—'): string {
  if (value == null || value === '') return fallback;
  return String(value);
}

/**
 * Convert a string to a URL-safe slug.
 * @example toSlug('My Product Name') → 'my-product-name'
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}
