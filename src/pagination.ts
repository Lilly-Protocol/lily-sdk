import type { PaginationQuery } from './models/common';

export interface CursorPage<T> {
  readonly items: readonly T[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
}

/**
 * Extracts pagination metadata from an HTTP response.
 * Works with cursor-based list endpoints that return items at the top level
 * and a cursor in the response headers or body.
 */
export function parseCursorPage<T>(
  items: readonly T[],
  cursor: string | null | undefined,
): CursorPage<T> {
  return {
    items,
    nextCursor: cursor ?? null,
    hasMore: cursor != null && cursor !== '',
  };
}

/**
 * Builds a PaginationQuery from a cursor string.
 * Returns an empty object when the cursor is null/empty.
 */
export function buildPaginationQuery(
  cursor: string | null | undefined,
): PaginationQuery {
  if (!cursor) {
    return {};
  }
  return { cursor };
}

/**
 * Async iterator helper that auto-paginates through a cursor-based list endpoint.
 *
 * @example
 * for await (const agent of paginate(fetchAgentPage, { limit: 100 })) {
 *   console.log(agent.id);
 * }
 */
export async function* paginate<T>(
  fetchPage: (query?: PaginationQuery) => Promise<CursorPage<T>>,
  options?: { limit?: number; maxPages?: number },
): AsyncGenerator<T, void, unknown> {
  const maxPages = options?.maxPages ?? 100;
  let pageCount = 0;
  let cursor: string | null = null;
  const seenCursors = new Set<string>();

  while (pageCount < maxPages) {
    const query: PaginationQuery = {
      ...(options?.limit ? { limit: options.limit } : {}),
      ...buildPaginationQuery(cursor),
    };
    const page = await fetchPage(query);
    for (const item of page.items) {
      yield item;
    }

    pageCount += 1;
    if (page.items.length === 0) {
      break;
    }
    if (options?.limit && page.items.length < options.limit) {
      break;
    }
    if (!page.hasMore || !page.nextCursor) {
      break;
    }
    if (seenCursors.has(page.nextCursor)) {
      break;
    }

    seenCursors.add(page.nextCursor);
    cursor = page.nextCursor;
  }
}
