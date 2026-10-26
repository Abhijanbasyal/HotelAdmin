/**
 * Centralized theme configuration.
 *
 * This is the SINGLE source of truth for available theme colors.
 * The ThemeProvider, Settings page, and any component that needs theme info
 * should import from here — never define theme values inline.
 */

export type ThemeColor = 'blue' | 'violet' | 'emerald' | 'teal' | 'rose' | 'amber';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColorConfig {
  id: ThemeColor;
  label: string;
  /** Tailwind/CSS HSL value used for visual swatches */
  swatch: string;
  /** Human-readable description */
  description: string;
}

/** All available theme colors with their display metadata */
export const THEME_COLORS: ThemeColorConfig[] = [
  {
    id: 'blue',
    label: 'Ocean Blue',
    swatch: 'hsl(221, 83%, 53%)',
    description: 'Classic professional blue',
  },
  {
    id: 'violet',
    label: 'Violet',
    swatch: 'hsl(263, 70%, 50%)',
    description: 'Rich and modern purple',
  },
  {
    id: 'emerald',
    label: 'Emerald',
    swatch: 'hsl(160, 84%, 39%)',
    description: 'Fresh and natural green',
  },
  {
    id: 'teal',
    label: 'Teal',
    swatch: 'hsl(172, 66%, 50%)',
    description: 'Balanced blue-green',
  },
  {
    id: 'rose',
    label: 'Rose',
    swatch: 'hsl(346, 77%, 49%)',
    description: 'Bold and energetic pink',
  },
  {
    id: 'amber',
    label: 'Amber',
    swatch: 'hsl(38, 92%, 50%)',
    description: 'Warm golden accent',
  },
] as const;

/** Default theme settings */
export const DEFAULT_THEME_COLOR: ThemeColor = 'blue';
export const DEFAULT_THEME_MODE: ThemeMode = 'system';

/** LocalStorage keys for persisting theme preferences */
export const THEME_STORAGE_KEYS = {
  COLOR: 'hms-theme-color',
  MODE: 'hms-theme-mode',
} as const;

/**
 * Semantic status color map.
 * These are FIXED — they never change with the selected primary theme.
 */
export const STATUS_COLORS = {
  success: {
    bg: 'bg-success-subtle',
    text: 'text-success',
    border: 'border-success',
    badge: 'bg-success-subtle text-success',
  },
  warning: {
    bg: 'bg-warning-subtle',
    text: 'text-warning',
    border: 'border-warning',
    badge: 'bg-warning-subtle text-warning',
  },
  danger: {
    bg: 'bg-danger-subtle',
    text: 'text-danger',
    border: 'border-danger',
    badge: 'bg-danger-subtle text-danger',
  },
  info: {
    bg: 'bg-info-subtle',
    text: 'text-info',
    border: 'border-info',
    badge: 'bg-info-subtle text-info',
  },
  neutral: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
    badge: 'bg-muted text-muted-foreground',
  },
} as const;
