import { createFileRoute } from '@tanstack/react-router'
import { dashboardSummaryQueryOptions } from '#/features/dashboard/api/dashboard.queries'
import {
  DashboardPending,
  SummaryCards,
} from '#/features/dashboard/components/summary-cards'

export const Route = createFileRoute('/_authenticated/')({
  ssr: false,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(dashboardSummaryQueryOptions()),
  pendingComponent: DashboardPending,
  head: () => ({
    meta: [{ title: 'Beranda | Arunika' }],
  }),
  component: DashboardPage,
})

function DashboardPage() {
  const { session } = Route.useRouteContext()
  const summary = Route.useLoaderData()

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
    </section>
  )
}
