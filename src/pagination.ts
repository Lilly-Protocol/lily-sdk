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
 * Page response shape accepted by paginate. Supports either a CursorPage or a plain array.
 */
export type PageResult<T> = readonly T[] | CursorPage<T>;

/**
 * Async iterator helper that auto-paginates through a cursor-based list endpoint.
 *
 * @example
 * for await (const agent of paginate(client.agents.list.bind(client.agents))) {
 *   console.log(agent.id);
 * }
 */
export async function* paginate<T>(
  fetchPage: (query?: PaginationQuery) => Promise<PageResult<T>>,
  options?: { limit?: number; maxPages?: number },
): AsyncGenerator<T, void, unknown> {
  const maxPages = options?.maxPages ?? 100;
  let pageCount = 0;
  let currentCursor: string | null | undefined = undefined;

  while (pageCount < maxPages) {
    const cursorQuery = buildPaginationQuery(currentCursor);
    const query: PaginationQuery = {
      ...(cursorQuery.cursor ? { cursor: cursorQuery.cursor } : {}),
      ...(options?.limit ? { limit: options.limit } : {}),
    };

    const hasQueryParams = Object.keys(query).length > 0;
    const result = await fetchPage(hasQueryParams ? query : undefined);
    pageCount += 1;

    let items: readonly T[];
    let nextCursor: string | null = null;

    if (Array.isArray(result)) {
      items = result;
      nextCursor = null;
    } else if (result && typeof result === 'object' && 'items' in result) {
      items = result.items;
      nextCursor = result.nextCursor ?? null;
    } else {
      break;
    }

    for (const item of items) {
      yield item;
    }

    if (items.length === 0) {
      break;
    }

    if (options?.limit && items.length < options.limit) {
      break;
    }

    if (!nextCursor) {
      break;
    }

    currentCursor = nextCursor;
  }
}
