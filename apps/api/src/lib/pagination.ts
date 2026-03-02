export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    cursor: string | null;
    hasMore: boolean;
  };
}

export function paginate<T extends { id?: string | number }>(
  items: T[],
  limit: number
): PaginatedResult<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const lastItem = data[data.length - 1];
  const cursor = hasMore && lastItem ? String(lastItem.id ?? "") : null;

  return { data, meta: { cursor, hasMore } };
}

export function parseLimit(raw: unknown, defaultVal = 20, max = 100): number {
  const n = Number(raw);
  if (isNaN(n) || n < 1) return defaultVal;
  return Math.min(n, max);
}
