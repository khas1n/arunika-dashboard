import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '#/lib/auth-middleware'
import {
  createFeed,
  deleteFeed,
  listFeeds,
  updateFeed,
} from '#/features/pakan/api/feed.server'
import {
  feedIdSchema,
  feedInputSchema,
  feedListQuerySchema,
  feedUpdateSchema,
} from '#/features/pakan/schemas/feed'

export const listFeedsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(feedListQuerySchema)
  .handler(async ({ data }) => listFeeds(data))

export const createFeedFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(feedInputSchema)
  .handler(async ({ data }) => createFeed(data))

export const updateFeedFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(feedUpdateSchema)
  .handler(async ({ data }) => updateFeed(data))

export const deleteFeedFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(feedIdSchema)
  .handler(async ({ data }) => deleteFeed(data))
