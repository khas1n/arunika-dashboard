import type { FC } from 'react'
import {
  createFileRoute,
  getRouteApi,
  notFound,
  useNavigate,
} from '@tanstack/react-router'
import { PageLoader } from '#/components/shared/page-loader'
import {
  defaultBibisQuery,
  defaultDadakanQuery,
  defaultPondDayQuery,
  defaultPondHeaderQuery,
  defaultTreatmentPlanQuery,
  kolamBibisQueryOptions,
  kolamDaysQueryOptions,
  kolamHeaderQueryOptions,
  kolamOverridesQueryOptions,
  kolamTreatmentPlanQueryOptions,
  kolamTreatmentsInfiniteOptions,
  treatmentsQueryOptions,
} from '#/features/pakan/api/kolam.queries'
import {
  pondDayDraftFn,
  pondDayExistsFn,
} from '#/features/pakan/api/kolam.functions'
import { PondLog } from '#/features/pakan/components/pond-log'
import { useKolamActions } from '#/features/pakan/hooks/use-kolam-actions'
import { useKolamPage } from '#/features/pakan/hooks/use-kolam-page'
import { kolamSearchSchema } from '#/features/pakan/schemas/kolam'
import type { PondTab } from '#/features/pakan/schemas/kolam'

const routeApi = getRouteApi('/_authenticated/kolam/$pondCode')

const KolamPage: FC<{ pondCode: string }> = ({ pondCode }) => {
  const { tab } = routeApi.useSearch()
  const navigate = useNavigate({ from: '/kolam/$pondCode' })
  const page = useKolamPage(pondCode)
  const {
    createOverride,
    revokeOverride,
    upsertDay,
    createTreatmentLog,
    updateTreatmentLog,
    revokeTreatmentLog,
  } = useKolamActions(pondCode)
  const cycle = page.header.rows.at(0) ?? null
  if (!cycle) throw notFound()

  const onTabChange = (next: PondTab) => {
    void navigate({
      to: '/kolam/$pondCode',
      params: { pondCode },
      search: (prev) => ({ ...prev, tab: next }),
      replace: true,
    })
  }

  return (
    <PondLog
      cycle={cycle}
      days={page.days.rows}
      dayRowCount={page.days.rowCount}
      dayTable={page.dayTable}
      daysFetching={page.daysFetching}
      overrides={page.overrides.rows}
      overrideRowCount={page.overrides.rowCount}
      overrideTable={page.overrideTable}
      overridesFetching={page.overridesFetching}
      treatments={page.treatments.rows}
      treatmentsPending={page.treatments.isPending}
      treatmentsFetching={page.treatments.isFetching}
      treatmentsFetchingNextPage={page.treatments.isFetchingNextPage}
      treatmentsHasNextPage={page.treatments.hasNextPage}
      onFetchMoreTreatments={page.treatments.fetchNextPage}
      treatmentRange={page.treatments.range}
      onTreatmentRangeChange={page.treatments.setRange}
      plannedTreatments={page.treatmentPlan.treatments}
      treatmentOptions={page.treatmentOptions}
      tab={tab}
      onTabChange={onTabChange}
      onCreateOverride={createOverride}
      onRevokeOverride={revokeOverride}
      onUpsertDay={upsertDay}
      onDayExists={(input) => pondDayExistsFn({ data: input })}
      onLoadDay={(input) => pondDayDraftFn({ data: input })}
      onCreateTreatment={createTreatmentLog}
      onUpdateTreatment={updateTreatmentLog}
      onRevokeTreatment={revokeTreatmentLog}
    />
  )
}

const KolamRoute: FC = () => {
  const { pondCode } = routeApi.useParams()
  return <KolamPage key={pondCode} pondCode={pondCode} />
}

export const Route = createFileRoute('/_authenticated/kolam/$pondCode')({
  ssr: false,
  validateSearch: kolamSearchSchema,
  loader: async ({ context, params }) => {
    const { pondCode } = params
    const header = await context.queryClient.ensureQueryData(
      kolamHeaderQueryOptions(defaultPondHeaderQuery(pondCode)),
    )
    if (header.rowCount === 0) throw notFound()
    await Promise.all([
      context.queryClient.ensureQueryData(
        kolamBibisQueryOptions(defaultBibisQuery(pondCode)),
      ),
      context.queryClient.ensureQueryData(
        kolamDaysQueryOptions(defaultPondDayQuery(pondCode)),
      ),
      context.queryClient.ensureQueryData(
        kolamOverridesQueryOptions(defaultDadakanQuery(pondCode)),
      ),
      context.queryClient.ensureInfiniteQueryData(
        kolamTreatmentsInfiniteOptions(pondCode),
      ),
      context.queryClient.ensureQueryData(
        kolamTreatmentPlanQueryOptions(defaultTreatmentPlanQuery(pondCode)),
      ),
      context.queryClient.ensureQueryData(treatmentsQueryOptions()),
    ])
  },
  pendingComponent: PageLoader,
  head: ({ params }) => ({
    meta: [{ title: `Kolam ${params.pondCode} | Arunika` }],
  }),
  component: KolamRoute,
})
