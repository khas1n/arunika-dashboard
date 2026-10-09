import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useServerTableControls } from '#/components/shared/data-table'
import {
  defaultBibisQuery,
  defaultPondHeaderQuery,
  kolamBibisQueryOptions,
  kolamBiomassQueryOptions,
  kolamDaysQueryOptions,
  kolamHeaderQueryOptions,
  kolamOverridesQueryOptions,
  toDadakanQuery,
  toPondDayQuery,
} from '#/features/pakan/api/kolam.queries'

/**
 * Header and bibis stay on suspense: their keys do not change while the user
 * pages a table. Days and dadakan use plain queries so a page change never
 * suspends the route and never remounts the rest of the pond screen.
 */
export function useKolamPage(pondCode: string) {
  const dayTable = useServerTableControls({
    sorting: [{ id: 'date', desc: false }],
  })
  const overrideTable = useServerTableControls({
    sorting: [{ id: 'status', desc: false }],
  })
  const headerQuery = defaultPondHeaderQuery(pondCode)
  const bibisQuery = defaultBibisQuery(pondCode)
  const dayQuery = toPondDayQuery(pondCode, dayTable.state)
  const dadakanQuery = toDadakanQuery(pondCode, overrideTable.state)
  const header = useSuspenseQuery(kolamHeaderQueryOptions(headerQuery))
  const bibis = useSuspenseQuery(kolamBibisQueryOptions(bibisQuery))
  const biomass = useSuspenseQuery(kolamBiomassQueryOptions({ pondCode }))
  const days = useQuery(kolamDaysQueryOptions(dayQuery))
  const overrides = useQuery(kolamOverridesQueryOptions(dadakanQuery))

  return {
    header: header.data,
    bibis: bibis.data,
    biomass: biomass.data,
    days: days.data ?? { rows: [], rowCount: 0 },
    overrides: overrides.data ?? { rows: [], rowCount: 0 },
    dayTable,
    overrideTable,
    daysFetching: days.isFetching && days.isPlaceholderData,
    overridesFetching: overrides.isFetching && overrides.isPlaceholderData,
  }
}
