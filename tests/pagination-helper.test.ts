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
      const fetchPage = vi
        .fn()
        .mockResolvedValue(parseCursorPage([1, 2, 3], null));
      const results: number[] = [];
      for await (const item of paginate<number>(fetchPage)) {
        results.push(item);
      }
      expect(results).toEqual([1, 2, 3]);
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('advances with cursor metadata without repeating a page', async () => {
      const fetchPage = vi
        .fn()
        .mockResolvedValueOnce(parseCursorPage([1, 2], 'c1'))
        .mockResolvedValueOnce(parseCursorPage([3, 4], null));
      const results: number[] = [];
      for await (const item of paginate<number>(fetchPage, { limit: 2 })) {
        results.push(item);
      }
      expect(results).toEqual([1, 2, 3, 4]);
      expect(fetchPage).toHaveBeenNthCalledWith(1, { limit: 2 });
      expect(fetchPage).toHaveBeenNthCalledWith(2, {
        limit: 2,
        cursor: 'c1',
      });
    });

    it('stops at maxPages', async () => {
      const fetchPage = vi
        .fn()
        .mockResolvedValueOnce(parseCursorPage([1], 'c1'))
        .mockResolvedValueOnce(parseCursorPage([2], 'c2'))
        .mockResolvedValueOnce(parseCursorPage([3], 'c3'));
      const results: number[] = [];
      for await (const item of paginate<number>(fetchPage, { maxPages: 2 })) {
        results.push(item);
      }
      expect(results).toEqual([1, 2]);
      expect(fetchPage).toHaveBeenCalledTimes(2);
    });

    it('stops when a page returns fewer items than the limit', async () => {
      const fetchPage = vi
        .fn()
        .mockResolvedValueOnce(parseCursorPage([1, 2], 'c1'))
        .mockResolvedValueOnce(parseCursorPage([3], 'c2'));
      const results: number[] = [];
      for await (const item of paginate<number>(fetchPage, { limit: 2 })) {
        results.push(item);
      }
      expect(results).toEqual([1, 2, 3]);
      expect(fetchPage).toHaveBeenCalledTimes(2);
    });

    it('stops on empty page', async () => {
      const fetchPage = vi.fn().mockResolvedValue(parseCursorPage([], 'c1'));
      const results: number[] = [];
      for await (const item of paginate<number>(fetchPage, { limit: 10 })) {
        results.push(item);
      }
      expect(results).toEqual([]);
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('stops on a cursor-less response even when the page is full', async () => {
      const fetchPage = vi
        .fn()
        .mockResolvedValue(parseCursorPage([1, 2], null));
      const results: number[] = [];
      for await (const item of paginate<number>(fetchPage, { limit: 2 })) {
        results.push(item);
      }
      expect(results).toEqual([1, 2]);
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('does not request the same cursor twice', async () => {
      const fetchPage = vi
        .fn()
        .mockResolvedValueOnce(parseCursorPage([1], 'c1'))
        .mockResolvedValueOnce(parseCursorPage([2], 'c1'));
      const results: number[] = [];
      for await (const item of paginate<number>(fetchPage)) {
        results.push(item);
      }
      expect(results).toEqual([1, 2]);
      expect(fetchPage).toHaveBeenCalledTimes(2);
    });
  });
});
