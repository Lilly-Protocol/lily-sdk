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
 * `fetchPage` receives a `PaginationQuery` (containing the `cursor` from the
 * previous response when present) and must return a `CursorPage<T>` describing
 * the fetched page: its items, the cursor for the next page, and whether more
 * pages exist. Iteration stops when the returned cursor is null/empty, a page
 * is shorter than `limit` (when `limit` is set), or `maxPages` is reached.
 *
 * @example
 * for await (const agent of paginate(client.agents.list.bind(client.agents))) {
 *   console.log(agent.id);
 * }
 */
export async function* paginate<T>(
  fetchPage: (query?: PaginationQuery) => Promise<CursorPage<T>>,
  options?: { limit?: number; maxPages?: number },
): AsyncGenerator<T, void, unknown> {
  const maxPages = options?.maxPages ?? 100;
  let nextCursor: string | undefined;

  for (let pageCount = 0; pageCount < maxPages; pageCount += 1) {
    const query: PaginationQuery = {
      ...(options?.limit !== undefined ? { limit: options.limit } : {}),
      ...buildPaginationQuery(nextCursor),
    };
    const page = await fetchPage(query);

    for (const item of page.items) {
      yield item;
    }

    // A short page means the dataset is exhausted even if a cursor leaks back.
    if (options?.limit !== undefined && page.items.length < options.limit) {
      break;
    }
    // No further cursor: the last page was reached.
    if (!page.hasMore || page.nextCursor === null || page.nextCursor === '') {
      break;
    }
    nextCursor = page.nextCursor;
  }
}
