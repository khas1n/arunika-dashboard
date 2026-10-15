import type { FC } from 'react'
import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router'
import { PageLoader } from '#/components/shared/page-loader'
import {
  defaultBibisQuery,
  defaultDadakanQuery,
  defaultPondDayQuery,
  defaultPondHeaderQuery,
  kolamBibisQueryOptions,
  kolamBiomassQueryOptions,
  kolamDaysQueryOptions,
  kolamHeaderQueryOptions,
  kolamOverridesQueryOptions,
} from '#/features/pakan/api/kolam.queries'
import { PondLog } from '#/features/pakan/components/pond-log'
import { useKolamActions } from '#/features/pakan/hooks/use-kolam-actions'
import { useKolamPage } from '#/features/pakan/hooks/use-kolam-page'

const routeApi = getRouteApi('/_authenticated/kolam/$pondCode')

const KolamPage: FC<{ pondCode: string }> = ({ pondCode }) => {
  const page = useKolamPage(pondCode)
  const { createOverride, revokeOverride, upsertDay } = useKolamActions(pondCode)
  const cycle = page.header.rows.at(0) ?? null
  const bibis = page.bibis.rows.at(0)
  if (!cycle || !bibis) throw notFound()

  return (
    <PondLog
      prepareOn={bibis.prepareOn}
      feedingOn={bibis.feedingOn}
      cycle={cycle}
      series={page.biomass.points}
      days={page.days.rows}
      dayRowCount={page.days.rowCount}
      dayTable={page.dayTable}
      daysFetching={page.daysFetching}
      bibis={page.bibis.rows}
      overrides={page.overrides.rows}
      overrideRowCount={page.overrides.rowCount}
      overrideTable={page.overrideTable}
      overridesFetching={page.overridesFetching}
      onCreateOverride={createOverride}
      onRevokeOverride={revokeOverride}
      onUpsertDay={upsertDay}
    />
  )
}

const KolamRoute: FC = () => {
  const { pondCode } = routeApi.useParams()
  return <KolamPage key={pondCode} pondCode={pondCode} />
}

export const Route = createFileRoute('/_authenticated/kolam/$pondCode')({
  ssr: false,
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
        kolamBiomassQueryOptions({ pondCode }),
      ),
      context.queryClient.ensureQueryData(
        kolamDaysQueryOptions(defaultPondDayQuery(pondCode)),
      ),
      context.queryClient.ensureQueryData(
        kolamOverridesQueryOptions(defaultDadakanQuery(pondCode)),
      ),
    ])
  },
  pendingComponent: PageLoader,
  head: ({ params }) => ({
    meta: [{ title: `Kolam ${params.pondCode} | Arunika` }],
  }),
  component: KolamRoute,
})
