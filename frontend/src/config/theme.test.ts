import { describe, it, expect } from 'vitest';
import { THEME_COLORS, DEFAULT_THEME_COLOR, THEME_STORAGE_KEYS } from './theme';

describe('theme configuration', () => {
  it('defines 6 curated theme colors', () => {
    expect(THEME_COLORS).toHaveLength(6);
    const ids = THEME_COLORS.map((c) => c.id);
    expect(ids).toEqual(['blue', 'violet', 'emerald', 'teal', 'rose', 'amber']);
  });

  it('provides valid swatch colors for each theme', () => {
    for (const color of THEME_COLORS) {
      expect(color.id).toBeTruthy();
      expect(color.label).toBeTruthy();
      expect(color.swatch).toMatch(/^hsl\(/);
    }
  });

  it('has a valid default theme color and storage keys', () => {
    expect(DEFAULT_THEME_COLOR).toBe('blue');
    expect(THEME_STORAGE_KEYS.COLOR).toBe('hms-theme-color');
    expect(THEME_STORAGE_KEYS.MODE).toBe('hms-theme-mode');
  });
});
