import { z } from 'zod'

/**
 * Shared page contract for list reads.
 *
 * `pageQuerySchema` and `pageSchema` are the contract. Infer the TypeScript
 * types from them so the client and the server cannot drift. Search is not
 * part of a page query; a list that has a search box extends the schema.
 */

export function pageQuerySchema<TSortId extends z.ZodType>(sortId: TSortId) {
  return z.object({
    pageIndex: z.number().int().min(0),
    pageSize: z.number().int().min(1).max(100),
    sortId,
    sortDesc: z.boolean(),
  })
}

export function pageSchema<TRow extends z.ZodType>(row: TRow) {
  return z.object({
    rows: z.array(row),
    rowCount: z.number().int().nonnegative(),
  })
}

export function slicePage<TRow>(
  rows: readonly TRow[],
  query: { pageIndex: number; pageSize: number },
): { rows: Array<TRow>; rowCount: number } {
  const start = query.pageIndex * query.pageSize
  return {
    rows: rows.slice(start, start + query.pageSize),
    rowCount: rows.length,
  }
}
