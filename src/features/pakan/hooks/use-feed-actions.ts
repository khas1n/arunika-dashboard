import { useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { useOptimisticMutation } from '#/hooks/use-optimistic-mutation'
import {
  createFeedFn,
  deleteFeedFn,
  updateFeedFn,
} from '#/features/pakan/api/feed.functions'
import { feedsQueryKey } from '#/features/pakan/api/feed.queries'
import type {
  FeedInput,
  FeedItem,
  FeedList,
  FeedListQuery,
  FeedUpdateInput,
} from '#/features/pakan/schemas/feed'

function isFeedQuery(value: unknown): value is FeedListQuery {
  return (
    value != null &&
    typeof value === 'object' &&
    'pageIndex' in value &&
    'pageSize' in value &&
    'search' in value &&
    typeof value.search === 'string'
  )
}

function isFeedList(value: unknown): value is FeedList {
  return (
    value != null &&
    typeof value === 'object' &&
    'rows' in value &&
    Array.isArray(value.rows) &&
    'rowCount' in value &&
    typeof value.rowCount === 'number'
  )
}

function matchesSearch(name: string, search: string) {
  const needle = search.trim().toLowerCase()
  return needle.length === 0 || name.toLowerCase().includes(needle)
}

/**
 * Create, update and delete for feeds. Each change shows in the list
 * immediately and is removed again when the request fails.
 */
export function useFeedActions() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: feedsQueryKey })

  const lists = () =>
    queryClient
      .getQueriesData({ queryKey: feedsQueryKey })
      .flatMap(([key, data]) => {
        const query = key[2]
        if (!isFeedQuery(query) || !isFeedList(data)) return []
        return [{ key, query, data }]
      })

  const create = useOptimisticMutation({
    mutationFn: (values: FeedInput & { clientId: string }) =>
      createFeedFn({ data: { name: values.name } }),
    scope: (values) => values.clientId,
    queryKey: feedsQueryKey,
    errorMessage: 'Jenis pakan gagal disimpan.',
    successMessage: 'Jenis pakan tersimpan.',
    invalidate,
    apply: (values) => {
      const tempId = `temp-${values.clientId}`
      const touched: Array<QueryKey> = []
      for (const { key, query, data } of lists()) {
        if (!matchesSearch(values.name, query.search)) continue
        touched.push(key)
        const temp: FeedItem = {
          id: tempId,
          name: values.name,
          createdAt: new Date(),
          usageCount: 0,
        }
        queryClient.setQueryData<FeedList>(key, {
          rowCount: data.rowCount + 1,
          rows:
            query.pageIndex === 0
              ? [temp, ...data.rows].slice(0, Math.max(data.rows.length, 1))
              : data.rows,
        })
      }
      return (latest) => {
        if (!latest) return
        for (const key of touched) {
          const current = queryClient.getQueryData(key)
          if (!isFeedList(current)) continue
          const rows = current.rows.filter((row) => row.id !== tempId)
          queryClient.setQueryData<FeedList>(key, {
            rows,
            rowCount:
              rows.length === current.rows.length
                ? current.rowCount
                : Math.max(0, current.rowCount - 1),
          })
        }
      }
    },
  })

  const update = useOptimisticMutation({
    mutationFn: (values: FeedUpdateInput) => updateFeedFn({ data: values }),
    scope: (values) => values.id,
    queryKey: feedsQueryKey,
    errorMessage: 'Jenis pakan gagal diperbarui.',
    successMessage: 'Jenis pakan diperbarui.',
    invalidate,
    apply: (values) => {
      const previousNames = new Map<string, string>()
      for (const { key, data } of lists()) {
        const row = data.rows.find((item) => item.id === values.id)
        if (!row || row.name === values.name) continue
        previousNames.set(JSON.stringify(key), row.name)
        queryClient.setQueryData<FeedList>(key, {
          ...data,
          rows: data.rows.map((item) =>
            item.id === values.id ? { ...item, name: values.name } : item,
          ),
        })
      }
      return (latest) => {
        if (!latest) return
        for (const [hash, name] of previousNames) {
          const key = JSON.parse(hash) as QueryKey
          const current = queryClient.getQueryData(key)
          if (!isFeedList(current)) continue
          queryClient.setQueryData<FeedList>(key, {
            ...current,
            rows: current.rows.map((item) =>
              item.id === values.id && item.name === values.name
                ? { ...item, name }
                : item,
            ),
          })
        }
      }
    },
  })

  const remove = useOptimisticMutation({
    mutationFn: (id: string) => deleteFeedFn({ data: { id } }),
    scope: (id) => id,
    queryKey: feedsQueryKey,
    errorMessage: 'Jenis pakan gagal dihapus.',
    successMessage: 'Jenis pakan dihapus.',
    invalidate,
    apply: (id) => {
      const removed = new Map<string, { index: number; row: FeedItem }>()
      for (const { key, data } of lists()) {
        const index = data.rows.findIndex((item) => item.id === id)
        if (index < 0) continue
        removed.set(JSON.stringify(key), { index, row: data.rows[index] })
        queryClient.setQueryData<FeedList>(key, {
          rowCount: Math.max(0, data.rowCount - 1),
          rows: data.rows.filter((item) => item.id !== id),
        })
      }
      return (latest) => {
        if (!latest) return
        for (const [hash, snapshot] of removed) {
          const key = JSON.parse(hash) as QueryKey
          const current = queryClient.getQueryData(key)
          if (!isFeedList(current)) continue
          if (current.rows.some((item) => item.id === id)) continue
          const rows = [...current.rows]
          rows.splice(Math.min(snapshot.index, rows.length), 0, snapshot.row)
          queryClient.setQueryData<FeedList>(key, {
            rows,
            rowCount: current.rowCount + 1,
          })
        }
      }
    },
  })

  return {
    createFeed: (values: FeedInput) =>
      create.mutateAsync({ ...values, clientId: crypto.randomUUID() }),
    updateFeed: update.mutateAsync,
    deleteFeed: remove.mutateAsync,
  }
}
