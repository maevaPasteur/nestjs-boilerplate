import { PaginatedResponse, Pagination } from '../interfaces/pagination.interface';

export function createPaginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);

  const pagination: Pagination = {
    currentPage: page,
    itemsPerPage: limit,
    totalItems: total,
    totalPages: totalPages,
    hasPreviousPage: page > 1,
    hasNextPage: page < totalPages,
  };

  return {
    items,
    pagination,
  };
}