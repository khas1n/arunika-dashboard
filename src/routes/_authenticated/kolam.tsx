import type { FC } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { z } from 'zod'
import { PageLoader } from '#/components/shared/page-loader'
import { kolamQueryOptions } from '#/features/pakan/api/kolam.queries'
import { PondLog } from '#/features/pakan/components/pond-log'
import { useKolamActions } from '#/features/pakan/hooks/use-kolam-actions'

const kolamSearchSchema = z.object({
  cycle: z.string().optional(),
})

const routeApi = getRouteApi('/_authenticated/kolam')

const KolamPage: FC = () => {
  const { cycle } = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const log = useSuspenseQuery(kolamQueryOptions(cycle))
  const { createOverride, revokeOverride } = useKolamActions()
  const data = log.data

  return (
    <section className="grid gap-6">
      <div className="grid gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Kolam</h1>
        <p className="text-sm text-muted-foreground">
          Catatan harian, pakan aktual, dan bibis untuk tiap kolam.
        </p>
      </div>
      <PondLog
        prepareOn={data.prepareOn}
        feedingOn={data.feedingOn}
        cycles={data.cycles}
        selectedId={data.selectedId}
        days={data.days}
        bibis={data.bibis}
        overrides={data.overrides}
        onSelectCycle={(id) => {
          void navigate({ search: { cycle: id } })
        }}
        onCreateOverride={createOverride}
        onRevokeOverride={revokeOverride}
      />
    </section>
  )
}

export const Route = createFileRoute('/_authenticated/kolam')({
  ssr: false,
  validateSearch: kolamSearchSchema,
  loaderDeps: ({ search }) => ({ cycle: search.cycle }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(kolamQueryOptions(deps.cycle)),
  pendingComponent: PageLoader,
  head: () => ({
    meta: [{ title: 'Kolam | Arunika' }],
  }),
  component: KolamPage,
})
