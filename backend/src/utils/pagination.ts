import type { Model, FilterQuery, PopulateOptions } from 'mongoose';
import type { IPaginationMeta } from './ApiResponse';

export interface IPaginationOptions {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  includeDeleted: boolean;
}

export interface IPaginatedResult<T> {
  data: T[];
  pagination: IPaginationMeta;
}

/**
 * Escapes special regular expression characters to prevent Regex injection and ReDoS.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

/**
 * Parse and sanitize query parameters for pagination, sorting, and deletion filtering.
 *
 * @param query Express query object (or parsed Zod query)
 * @param allowedSortFields Allowlist of field names that can be sorted
 * @param defaultSort Fallback sort field and order
 */
export function parsePaginationOptions(
  query: Record<string, unknown>,
  allowedSortFields: string[] = ['createdAt', 'updatedAt'],
  defaultSort: { field: string; order: 'asc' | 'desc' } = { field: 'createdAt', order: 'desc' }
): IPaginationOptions {
  const pageRaw = query['page'];
  let page = typeof pageRaw === 'number' ? pageRaw : parseInt(String(pageRaw || 1), 10);
  if (isNaN(page) || page < 1) page = 1;

  const limitRaw = query['limit'];
  let limit = typeof limitRaw === 'number' ? limitRaw : parseInt(String(limitRaw || 10), 10);
  if (isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100;

  const skip = (page - 1) * limit;

  // Sorting allowlist verification
  const rawSortBy = typeof query['sortBy'] === 'string' ? query['sortBy'].trim() : '';
  const sortBy = allowedSortFields.includes(rawSortBy) ? rawSortBy : defaultSort.field;

  const rawSortOrder = typeof query['sortOrder'] === 'string' ? query['sortOrder'].toLowerCase() : '';
  const sortOrder: 'asc' | 'desc' = rawSortOrder === 'asc' ? 'asc' : defaultSort.order;

  // Search string sanitization
  const rawSearch = typeof query['search'] === 'string' ? query['search'].trim() : undefined;
  const search = rawSearch && rawSearch.length > 0 ? rawSearch : undefined;

  // Soft deletion filtering
  const rawIncludeDeleted = query['includeDeleted'];
  const includeDeleted =
    rawIncludeDeleted === true || rawIncludeDeleted === 'true' || rawIncludeDeleted === '1';

  return {
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
    search,
    includeDeleted,
  };
}

/**
 * Executes an optimized paginated database query.
 * Enforces soft-delete filtering unless explicitly requested.
 */
export async function paginateQuery<T>(
  model: Model<T>,
  filter: FilterQuery<T> = {},
  options: IPaginationOptions,
  select?: string | Record<string, number>,
  populate?: PopulateOptions | (PopulateOptions | string)[]
): Promise<IPaginatedResult<T>> {
  const queryFilter: Record<string, unknown> = { ...(filter as Record<string, unknown>) };

  // Enforce soft deletion convention if not explicitly queried
  if (!options.includeDeleted && queryFilter['isDeleted'] === undefined) {
    queryFilter['isDeleted'] = false;
  }

  const sortDirection = options.sortOrder === 'asc' ? 1 : -1;
  const sortObj: Record<string, 1 | -1> = { [options.sortBy]: sortDirection };

  // Always secondary sort by _id for deterministic pagination
  if (options.sortBy !== '_id') {
    sortObj['_id'] = sortDirection;
  }

  let dbQuery = model
    .find(queryFilter as FilterQuery<T>)
    .sort(sortObj)
    .skip(options.skip)
    .limit(options.limit);

  if (select) {
    dbQuery = dbQuery.select(select);
  }

  if (populate) {
    dbQuery = dbQuery.populate(populate as unknown as Parameters<typeof dbQuery.populate>[0]);
  }

  // Execute count and find in parallel
  const [data, total] = await Promise.all([
    dbQuery.exec(),
    model.countDocuments(queryFilter as FilterQuery<T>).exec(),
  ]);

  const totalPages = Math.ceil(total / options.limit) || 1;

  const pagination: IPaginationMeta = {
    page: options.page,
    limit: options.limit,
    total,
    totalPages,
    hasNextPage: options.page < totalPages,
    hasPrevPage: options.page > 1,
  };

  return {
    data,
    pagination,
  };
}
