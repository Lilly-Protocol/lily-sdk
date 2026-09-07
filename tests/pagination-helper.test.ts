import { describe, it, expect, vi } from 'vitest';
import {
  parseCursorPage,
  buildPaginationQuery,
  paginate,
} from '../src/pagination';
import type { CursorPage } from '../src/pagination';

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
    const page = (
      items: number[],
      nextCursor: string | null,
    ): CursorPage<number> => ({
      items,
      nextCursor,
      hasMore: nextCursor != null && nextCursor !== '',
    });

    it('yields all items from a single cursor-less page', async () => {
      const fetchPage = vi.fn().mockResolvedValue(page([1, 2, 3], null));
      const results: number[] = [];
      for await (const item of paginate<number>(fetchPage)) {
        results.push(item);
      }
      expect(results).toEqual([1, 2, 3]);
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('advances on cursor metadata across a two-page dataset (issue #403)', async () => {
      const fetchPage = vi
        .fn()
        .mockResolvedValueOnce(page([1, 2], 'c1'))
        .mockResolvedValueOnce(page([3, 4], null));
      const results: number[] = [];
      for await (const item of paginate<number>(fetchPage, { limit: 2 })) {
        results.push(item);
      }
      expect(results).toEqual([1, 2, 3, 4]);
      expect(fetchPage).toHaveBeenCalledTimes(2);
      // First call carries only the limit, second call feeds the cursor back.
      expect(fetchPage).toHaveBeenNthCalledWith(1, { limit: 2 });
      expect(fetchPage).toHaveBeenNthCalledWith(2, {
        limit: 2,
        cursor: 'c1',
      });
    });

    it('never re-fetches a page whose length equals limit (issue #403)', async () => {
      // Old bug: a full page with no further cursor was re-requested forever,
      // yielding duplicate items.
      const fetchPage = vi
        .fn()
        .mockResolvedValueOnce(page([1, 2], null))
        .mockResolvedValue(page([1, 2], null));
      const results: number[] = [];
      for await (const item of paginate<number>(fetchPage, { limit: 2 })) {
        results.push(item);
      }
      expect(results).toEqual([1, 2]);
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('stops at maxPages while the server keeps returning cursors', async () => {
      const fetchPage = vi.fn().mockResolvedValue(page([1, 2], 'c-next'));
      const results: number[] = [];
      for await (const item of paginate<number>(fetchPage, {
        limit: 2,
        maxPages: 3,
      })) {
        results.push(item);
      }
      expect(results).toEqual([1, 2, 1, 2, 1, 2]);
      expect(fetchPage).toHaveBeenCalledTimes(3);
      expect(fetchPage).toHaveBeenLastCalledWith({
        limit: 2,
        cursor: 'c-next',
      });
    });

    it('stops on an empty page', async () => {
      const fetchPage = vi.fn().mockResolvedValue(page([], null));
      const results: number[] = [];
      for await (const item of paginate<number>(fetchPage, { limit: 10 })) {
        results.push(item);
      }
      expect(results).toEqual([]);
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('stops when a page is shorter than the limit', async () => {
      const fetchPage = vi
        .fn()
        .mockResolvedValueOnce(page([1, 2], 'c1'))
        .mockResolvedValueOnce(page([3], 'c2'));
      const results: number[] = [];
      for await (const item of paginate<number>(fetchPage, { limit: 2 })) {
        results.push(item);
      }
      expect(results).toEqual([1, 2, 3]);
      expect(fetchPage).toHaveBeenCalledTimes(2);
    });

    it('stops when hasMore is false even if a cursor leaks back', async () => {
      const fetchPage = vi.fn().mockResolvedValue({
        items: [1],
        nextCursor: 'c1',
        hasMore: false,
      });
      const results: number[] = [];
      for await (const item of paginate<number>(fetchPage)) {
        results.push(item);
      }
      expect(results).toEqual([1]);
      expect(fetchPage).toHaveBeenCalledTimes(1);
    });
  });
});
