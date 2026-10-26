import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatCurrency,
  formatNumber,
  formatFileSize,
  getInitials,
} from './format';

describe('format utilities', () => {
  describe('formatDate', () => {
    it('formats a date correctly', () => {
      expect(formatDate('2024-06-15T00:00:00Z')).toBe('Jun 15, 2024');
    });

    it('handles empty or null values', () => {
      expect(formatDate(null)).toBe('—');
      expect(formatDate(undefined)).toBe('—');
    });

    it('handles invalid dates', () => {
      expect(formatDate('invalid-date')).toBe('Invalid date');
    });
  });

  describe('formatCurrency', () => {
    it('formats currency in USD by default', () => {
      expect(formatCurrency(1234.5)).toBe('$1,234.50');
    });

    it('handles null/undefined gracefully', () => {
      expect(formatCurrency(null)).toBe('—');
      expect(formatCurrency(undefined)).toBe('—');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with thousand separators', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });
  });

  describe('formatFileSize', () => {
    it('formats byte sizes correctly', () => {
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
    });
  });

  describe('getInitials', () => {
    it('extracts two initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Alice')).toBe('A');
      expect(getInitials('John Robert Smith')).toBe('JR');
      expect(getInitials('')).toBe('?');
    });
  });
});
