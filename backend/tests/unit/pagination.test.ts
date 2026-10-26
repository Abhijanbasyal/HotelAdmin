import { describe, it, expect } from 'vitest';
import {
  escapeRegex,
  parsePaginationOptions,
} from '@/utils/pagination';

describe('Pagination & Filtering Utilities', () => {
  describe('escapeRegex', () => {
    it('escapes special regex characters correctly', () => {
      const input = 'hotel (deluxe) + room [101] *?^$';
      const escaped = escapeRegex(input);
      expect(escaped).toBe('hotel\\ \\(deluxe\\)\\ \\+\\ room\\ \\[101\\]\\ \\*\\?\\^\\$');
      // Verify safe creation in RegExp without syntax errors
      const regex = new RegExp(escaped, 'i');
      expect(regex.test(input)).toBe(true);
    });

    it('returns empty string if given empty string', () => {
      expect(escapeRegex('')).toBe('');
    });
  });

  describe('parsePaginationOptions', () => {
    it('uses default values when query is empty', () => {
      const opts = parsePaginationOptions({});
      expect(opts.page).toBe(1);
      expect(opts.limit).toBe(10);
      expect(opts.skip).toBe(0);
      expect(opts.sortBy).toBe('createdAt');
      expect(opts.sortOrder).toBe('desc');
      expect(opts.includeDeleted).toBe(false);
      expect(opts.search).toBeUndefined();
    });

    it('parses valid numeric strings for page and limit', () => {
      const opts = parsePaginationOptions({ page: '3', limit: '25' });
      expect(opts.page).toBe(3);
      expect(opts.limit).toBe(25);
      expect(opts.skip).toBe(50); // (3 - 1) * 25
    });

    it('enforces maximum limit cap of 100', () => {
      const opts = parsePaginationOptions({ limit: '500' });
      expect(opts.limit).toBe(100);
    });

    it('normalizes negative or invalid page and limit to defaults', () => {
      const opts = parsePaginationOptions({ page: '-5', limit: 'invalid' });
      expect(opts.page).toBe(1);
      expect(opts.limit).toBe(10);
    });

    it('validates sortBy against allowlist and rejects disallowed fields', () => {
      const allowed = ['name', 'price', 'createdAt'];
      const valid = parsePaginationOptions({ sortBy: 'price' }, allowed);
      expect(valid.sortBy).toBe('price');

      // Attempt injection or unindexed field
      const invalid = parsePaginationOptions({ sortBy: 'unindexedField' }, allowed, {
        field: 'createdAt',
        order: 'desc',
      });
      expect(invalid.sortBy).toBe('createdAt');
    });

    it('normalizes sortOrder to asc or desc', () => {
      const asc = parsePaginationOptions({ sortOrder: 'asc' });
      expect(asc.sortOrder).toBe('asc');

      const desc = parsePaginationOptions({ sortOrder: 'DESC' });
      expect(desc.sortOrder).toBe('desc');

      const invalid = parsePaginationOptions({ sortOrder: 'malicious' });
      expect(invalid.sortOrder).toBe('desc');
    });

    it('parses includeDeleted correctly', () => {
      expect(parsePaginationOptions({ includeDeleted: 'true' }).includeDeleted).toBe(true);
      expect(parsePaginationOptions({ includeDeleted: '1' }).includeDeleted).toBe(true);
      expect(parsePaginationOptions({ includeDeleted: true }).includeDeleted).toBe(true);
      expect(parsePaginationOptions({ includeDeleted: 'false' }).includeDeleted).toBe(false);
      expect(parsePaginationOptions({}).includeDeleted).toBe(false);
    });

    it('trims search query and drops empty string', () => {
      expect(parsePaginationOptions({ search: '  luxury suite  ' }).search).toBe('luxury suite');
      expect(parsePaginationOptions({ search: '   ' }).search).toBeUndefined();
    });
  });
});
