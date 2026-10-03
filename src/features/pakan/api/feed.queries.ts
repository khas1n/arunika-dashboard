import { queryOptions } from '@tanstack/react-query'
import { listFeedsFn } from '#/features/pakan/api/feed.functions'

export const feedsQueryKey = ['pakan', 'feeds'] as const

export function feedsQueryOptions() {
  return queryOptions({
    queryKey: feedsQueryKey,
    queryFn: () => listFeedsFn(),
    staleTime: 30_000,
  })
}
