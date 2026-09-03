import { describe, it, expect, vi } from 'vitest';
import {
  parseCursorPage,
  buildPaginationQuery,
  paginate,
} from '../src/pagination';

describe('pagination helper (issue #61)', () => {
  describe('parseCursorPage', () => {
    it('returns items and cursor when provided', () => {
      const page = parseCursorPage([1, 2, 3], 'abc123');
      expect(page.items).toEqual([1, 2, 3]);
      expect(page.nextCursor).toBe('abc123');
      expect(page.hasMore).toBe(true);
    });

    it('sets hasMore to false when cursor is null', () => {
      const page = parseCursorPage([1, 2], null);
      expect(page.hasMore).toBe(false);
      expect(page.nextCursor).toBeNull();
    });

    it('sets hasMore to false when cursor is empty string', () => {
      const page = parseCursorPage([1], '');
      expect(page.hasMore).toBe(false);
    });

    it('handles undefined cursor', () => {
      const page = parseCursorPage([1, 2, 3], undefined);
      expect(page.nextCursor).toBeNull();
      expect(page.hasMore).toBe(false);
    });

    it('returns empty items array when given empty', () => {
      const page = parseCursorPage([], 'cursor');
      expect(page.items).toEqual([]);
      expect(page.hasMore).toBe(true);
    });
  });

  describe('buildPaginationQuery', () => {
    it('returns empty object when cursor is null', () => {
      expect(buildPaginationQuery(null)).toEqual({});
    });

    it('returns empty object when cursor is empty', () => {
      expect(buildPaginationQuery('')).toEqual({});
    });

    it('returns empty object when cursor is undefined', () => {
      expect(buildPaginationQuery(undefined)).toEqual({});
    });

    it('returns cursor in query when provided', () => {
      expect(buildPaginationQuery('abc123')).toEqual({ cursor: 'abc123' });
    });
  });

  describe('paginate', () => {
    it('yields all items from a single page', async () => {
      const fetchPage = vi.fn().mockResolvedValue([1, 2, 3]);
      const results: number[] = [];
      for await (const item of paginate(fetchPage)) {
        results.push(item);
      }
      expect(results).toEqual([1, 2, 3]);
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('stops at maxPages when limit is set', async () => {
      const fetchPage = vi.fn().mockResolvedValue([1, 2]);
      const results: number[] = [];
      for await (const item of paginate(fetchPage, { limit: 2, maxPages: 3 })) {
        results.push(item);
      }
      expect(results.length).toBe(6); // 3 pages * 2 items
      expect(fetchPage).toHaveBeenCalledTimes(3);
    });

    it('stops when page returns fewer items than limit', async () => {
      const fetchPage = vi.fn()
        .mockResolvedValueOnce([1, 2])
        .mockResolvedValueOnce([3]);
      const results: number[] = [];
      for await (const item of paginate(fetchPage, { limit: 2 })) {
        results.push(item);
      }
      expect(results).toEqual([1, 2, 3]);
      expect(fetchPage).toHaveBeenCalledTimes(2);
    });

    it('stops on empty page', async () => {
      const fetchPage = vi.fn().mockResolvedValue([]);
      const results: number[] = [];
      for await (const item of paginate(fetchPage, { limit: 10 })) {
        results.push(item);
      }
      expect(results).toEqual([]);
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });
  });
});
