import { useDebouncedValue } from '#/hooks/use-debounced-value'
import type { FC } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { useServerTableControls } from '#/components/shared/data-table'
import { dashboardSummaryQueryOptions } from '#/features/dashboard/api/dashboard.queries'
import {
  DashboardPending,
  SummaryCards,
} from '#/features/dashboard/components/summary-cards'
import {
  defaultFeedListQuery,
  feedsQueryOptions,
  toFeedListQuery,
} from '#/features/pakan/api/feed.queries'
import { FeedManager } from '#/features/pakan/components/feed-manager'
import { useFeedActions } from '#/features/pakan/hooks/use-feed-actions'

const routeApi = getRouteApi('/_authenticated/')

const DashboardPage: FC = () => {
  const { session } = routeApi.useRouteContext()
  const summary = routeApi.useLoaderData()
  const table = useServerTableControls()
  const search = useDebouncedValue(table.state.globalFilter, 300)
  const query = toFeedListQuery(table.state, search)
  const feedsQuery = useQuery(feedsQueryOptions(query))
  const feeds = feedsQuery.data ?? { rows: [], rowCount: 0 }
  const { createFeed, updateFeed, deleteFeed } = useFeedActions()

  return (
    <section className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Selamat datang, {session.user.name}
        </h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan akun di dasbor Arunika.
        </p>
      </div>
      <SummaryCards
        userCount={summary.userCount}
        sessionCount={summary.sessionCount}
      />
      <FeedManager
        feeds={feeds.rows}
        rowCount={feeds.rowCount}
        server={table}
        isFetching={feedsQuery.isFetching && feedsQuery.isPlaceholderData}
        onCreate={createFeed}
        onUpdate={updateFeed}
        onDelete={deleteFeed}
      />
    </section>
  )
}

export const Route = createFileRoute('/_authenticated/')({
  ssr: false,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(dashboardSummaryQueryOptions()),
      context.queryClient.ensureQueryData(
        feedsQueryOptions(defaultFeedListQuery),
      ),
    ]).then(([summary]) => summary),
  pendingComponent: DashboardPending,
  head: () => ({
    meta: [{ title: 'Beranda | Arunika' }],
  }),
  component: DashboardPage,
})
