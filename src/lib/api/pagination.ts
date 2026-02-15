import { z } from 'zod'

export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
})

export interface PaginationMeta {
  total: number
  limit: number
  offset: number
  has_more: boolean
}

export function buildPaginationMeta(
  total: number,
  limit: number,
  offset: number
): PaginationMeta {
  return {
    total,
    limit,
    offset,
    has_more: offset + limit < total,
  }
}
