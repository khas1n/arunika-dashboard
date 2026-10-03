import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { dashboardSummaryQueryOptions } from '#/features/dashboard/api/dashboard.queries'
import {
  DashboardPending,
  SummaryCards,
} from '#/features/dashboard/components/summary-cards'
import { feedsQueryOptions } from '#/features/pakan/api/feed.queries'
import { FeedManager } from '#/features/pakan/components/feed-manager'
import { useFeedActions } from '#/features/pakan/hooks/use-feed-actions'

export const Route = createFileRoute('/_authenticated/')({
  ssr: false,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(dashboardSummaryQueryOptions()),
      context.queryClient.ensureQueryData(feedsQueryOptions()),
    ]).then(([summary]) => summary),
  pendingComponent: DashboardPending,
  head: () => ({
    meta: [{ title: 'Beranda | Arunika' }],
  }),
  component: DashboardPage,
})

function DashboardPage() {
  const { session } = Route.useRouteContext()
  const summary = Route.useLoaderData()
  const { data: feeds } = useSuspenseQuery(feedsQueryOptions())
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
        feeds={feeds}
        onCreate={createFeed}
        onUpdate={updateFeed}
        onDelete={deleteFeed}
      />
    </section>
  )
}
