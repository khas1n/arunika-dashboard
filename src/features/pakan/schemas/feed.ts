import { z } from 'zod'

/**
 * Single source of truth for the Feed (jenis pakan) contract.
 *
 * The form validates with these schemas, the server functions validate their
 * input with the same schemas, and every type below is inferred from them. A
 * rule or a field changed here changes the form, the endpoint, and the types
 * together. Plain `.ts` on purpose: it is safe to import from client and
 * server code.
 */

const idSchema = z.string().min(1)

export const feedNameSchema = z
  .string()
  .trim()
  .min(1, 'Nama jenis pakan wajib diisi')
  .max(60, 'Nama jenis pakan maksimal 60 karakter')

export const feedInputSchema = z.object({ name: feedNameSchema })

export const feedUpdateSchema = feedInputSchema.extend({ id: idSchema })

export const feedIdSchema = z.object({ id: idSchema })

/** What the server returns for one feed. */
export const feedItemSchema = z.object({
  id: idSchema,
  name: z.string(),
  createdAt: z.date(),
  /** Rows elsewhere that point at this feed. A feed in use cannot be deleted. */
  usageCount: z.number().int().nonnegative(),
})

export type FeedInput = z.infer<typeof feedInputSchema>
export type FeedUpdateInput = z.infer<typeof feedUpdateSchema>
export type FeedIdInput = z.infer<typeof feedIdSchema>
export type FeedItem = z.infer<typeof feedItemSchema>
