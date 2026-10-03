import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createFeedFn,
  deleteFeedFn,
  updateFeedFn,
} from '#/features/pakan/api/feed.functions'
import { feedsQueryKey } from '#/features/pakan/api/feed.queries'
import type { FeedInput, FeedUpdateInput } from '#/features/pakan/schemas/feed'

/**
 * Create, update and delete for feeds. Each action refreshes the feed list
 * after it succeeds. A failure rejects, so the caller can show the message.
 */
export function useFeedActions() {
  const queryClient = useQueryClient()
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: feedsQueryKey })

  const create = useMutation({
    mutationFn: (values: FeedInput) => createFeedFn({ data: values }),
    onSuccess: refresh,
  })
  const update = useMutation({
    mutationFn: (values: FeedUpdateInput) => updateFeedFn({ data: values }),
    onSuccess: refresh,
  })
  const remove = useMutation({
    mutationFn: (id: string) => deleteFeedFn({ data: { id } }),
    onSuccess: refresh,
  })

  return {
    createFeed: create.mutateAsync,
    updateFeed: update.mutateAsync,
    deleteFeed: remove.mutateAsync,
  }
}
