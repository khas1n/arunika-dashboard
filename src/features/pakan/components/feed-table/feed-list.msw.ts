import { faker } from '@faker-js/faker'
import { delay, http, HttpResponse } from 'msw'
import { feedListQuerySchema } from '#/features/pakan/schemas/feed'
import type { FeedItem } from '#/features/pakan/schemas/feed'

export const feedListUrl = '/api/pakan/feeds'

faker.seed(12)

export const serverFeeds: Array<FeedItem> = Array.from(
  { length: 36 },
  (_, index) => ({
    id: `feed-${String(index + 1).padStart(3, '0')}`,
    name:
      index === 0
        ? '781'
        : index === 1
          ? 'Safir'
          : `${faker.commerce.productAdjective()} ${index + 1}`,
    createdAt: new Date(Date.UTC(2026, 0, index + 1)),
    usageCount: index % 5,
  }),
)

export function filterServerFeeds(body: unknown) {
  const query = feedListQuerySchema.parse(body)
  const search = query.search.trim().toLowerCase()
  const matched = serverFeeds.filter((feed) =>
    search.length === 0 ? true : feed.name.toLowerCase().includes(search),
  )
  const sorted = [...matched].sort((left, right) => {
    const result =
      query.sortId === 'createdAt'
        ? left.createdAt.getTime() - right.createdAt.getTime()
        : left.name.localeCompare(right.name, 'id')
    return query.sortDesc ? -result : result
  })
  const start = query.pageIndex * query.pageSize
  return {
    rows: sorted.slice(start, start + query.pageSize),
    rowCount: sorted.length,
  }
}

export const feedListHandler = http.post(feedListUrl, async ({ request }) => {
  await delay(400)
  return HttpResponse.json(filterServerFeeds(await request.json()))
})

export const feedListLoadingHandler = http.post(feedListUrl, async () => {
  await delay('infinite')
  return HttpResponse.json({ rows: [], rowCount: 0 })
})
