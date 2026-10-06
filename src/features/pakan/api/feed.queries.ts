import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { listFeedsFn } from '#/features/pakan/api/feed.functions'
import { feedListSchema } from '#/features/pakan/schemas/feed'
import type { FeedListQuery } from '#/features/pakan/schemas/feed'
import type { ServerTableControls } from '#/components/shared/data-table'
import { initialServerTableState } from '#/components/shared/data-table'

export const feedsQueryKey = ['pakan', 'feeds'] as const

/** Matches `useServerTableControls` before the user changes page, sort, or search. */
export const defaultFeedListQuery = {
  pageIndex: initialServerTableState.pagination.pageIndex,
  pageSize: initialServerTableState.pagination.pageSize,
  search: initialServerTableState.globalFilter,
  sortId: 'name',
  sortDesc: false,
} satisfies FeedListQuery

export function toFeedListQuery(
  state: ServerTableControls['state'],
  search: string,
): FeedListQuery {
  const sort = state.sorting.length > 0 ? state.sorting[0] : undefined
  return {
    pageIndex: state.pagination.pageIndex,
    pageSize: state.pagination.pageSize,
    search,
    sortId: sort && sort.id === 'createdAt' ? 'createdAt' : 'name',
    sortDesc: sort ? sort.desc : false,
  }
}

export function feedsQueryOptions(query: FeedListQuery) {
  return queryOptions({
    queryKey: [...feedsQueryKey, query],
    queryFn: async () =>
      feedListSchema.parse(await listFeedsFn({ data: query })),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}
