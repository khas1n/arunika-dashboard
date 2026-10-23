import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import {
  inventoryActivityQueryOptions,
  inventoryOverviewQueryOptions,
} from '#/features/pakan/api/inventory.queries'
import { InventoryPage } from '#/features/pakan/components/inventory'
import { usePakanActivityTable } from '#/features/pakan/hooks/use-pakan-activity-table'
import { useInventoryActions } from '#/features/pakan/hooks/use-inventory-actions'
import {
  pakanSearchSchema,
  resolvePakanSearch,
} from '#/features/pakan/schemas/inventory'
import type { ActivityQuery } from '#/features/pakan/schemas/inventory'

export const Route = createFileRoute('/_authenticated/pakan')({
  validateSearch: pakanSearchSchema,
  ssr: false,
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(inventoryOverviewQueryOptions()),
  head: () => ({
    meta: [{ title: 'Pakan | Arunika' }],
  }),
  component: PakanRoute,
})

function PakanRoute() {
  const search = resolvePakanSearch(Route.useSearch())
  const activityTable = usePakanActivityTable(search)
  const query = {
    pageIndex: search.page,
    pageSize: search.pageSize,
    search: search.q,
    sortId: search.sort,
    sortDesc: search.desc,
    type: search.type,
    feedId: search.feed === '' ? null : search.feed,
    occurredOn: null,
  } satisfies ActivityQuery
  const overview = useQuery(inventoryOverviewQueryOptions())
  const activity = useQuery(inventoryActivityQueryOptions(query))
  const actions = useInventoryActions()

  return (
    <InventoryPage
      overview={overview.data ?? null}
      activity={activity.data?.rows ?? []}
      activityCount={activity.data?.rowCount}
      activityTable={activityTable.table}
      activityType={search.type}
      onActivityTypeChange={activityTable.setType}
      activityFeedId={search.feed === '' ? null : search.feed}
      onActivityFeedIdChange={activityTable.setFeed}
      isLoading={overview.isPending}
      isError={overview.isError}
      errorMessage={
        overview.error instanceof Error ? overview.error.message : undefined
      }
      onRetry={() => {
        void overview.refetch()
      }}
      activityLoading={activity.isPending}
      activityFetching={activity.isFetching && activity.isPlaceholderData}
      onCreateReceipt={actions.createReceipt}
      onCreateBibis={actions.createBibis}
      onCreateOpname={actions.createOpname}
    />
  )
}
