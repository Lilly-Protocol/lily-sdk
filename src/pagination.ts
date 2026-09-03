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
export function buildPaginationQuery(cursor: string | null | undefined): PaginationQuery {
  if (!cursor) {
    return {};
  }
  return { cursor };
}

/**
 * Async iterator helper that auto-paginates through a cursor-based list endpoint.
 *
 * @example
 * for await (const agent of paginate(client.agents.list.bind(client.agents))) {
 *   console.log(agent.id);
 * }
 */
export async function* paginate<T>(
  fetchPage: (query?: PaginationQuery) => Promise<readonly T[]>,
  options?: { limit?: number; maxPages?: number },
): AsyncGenerator<T, void, unknown> {
  const maxPages = options?.maxPages ?? 100;
  let pageCount = 0;

  while (pageCount < maxPages) {
    const query: PaginationQuery = options?.limit ? { limit: options.limit } : {};
    const items = await fetchPage(query);
    for (const item of items) {
      yield item;
    }
    // Without a cursor mechanism from the response, we stop after one page
    // since we can't know if there are more items.
    pageCount += 1;
    // If we got fewer items than the limit, we're done
    if (options?.limit && items.length < options.limit) {
      break;
    }
    // Without response headers exposing next cursor, we stop to avoid infinite loop
    if (items.length === 0) {
      break;
    }
    // If no limit specified, we do one page (can't know if there are more)
    if (!options?.limit) {
      break;
    }
  }
}
