import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '#/lib/auth-middleware'
import {
  createBibisRecord,
  createFeedReceipt,
  createStockOpname,
  listInventoryActivity,
  listInventoryOverview,
} from '#/features/pakan/api/inventory.server'
import {
  activityQuerySchema,
  bibisInputSchema,
  opnameInputSchema,
  receiptInputSchema,
} from '#/features/pakan/schemas/inventory'

export const listInventoryOverviewFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => listInventoryOverview())

export const listInventoryActivityFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(activityQuerySchema)
  .handler(async ({ data }) => listInventoryActivity(data))

export const createFeedReceiptFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(receiptInputSchema)
  .handler(async ({ data, context }) =>
    createFeedReceipt(data, context.session.user.id),
  )

export const createBibisRecordFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(bibisInputSchema)
  .handler(async ({ data, context }) =>
    createBibisRecord(data, context.session.user.id),
  )

export const createStockOpnameFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(opnameInputSchema)
  .handler(async ({ data, context }) =>
    createStockOpname(data, context.session.user.id),
  )
