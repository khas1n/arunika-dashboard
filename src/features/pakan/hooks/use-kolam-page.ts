import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useServerTableControls } from '#/components/shared/data-table'
import {
  defaultBibisQuery,
  defaultPondHeaderQuery,
  defaultTreatmentPlanQuery,
  kolamBibisQueryOptions,
  kolamDaysQueryOptions,
  kolamHeaderQueryOptions,
  kolamOverridesQueryOptions,
  kolamTreatmentPlanQueryOptions,
  toDadakanQuery,
  toPondDayQuery,
  treatmentsQueryOptions,
} from '#/features/pakan/api/kolam.queries'
import { useKolamTreatments } from '#/features/pakan/hooks/use-kolam-treatments'

/**
 * Header and bibis stay on suspense: their keys do not change while the user
 * pages a table. Days and dadakan use plain queries so a page change never
 * suspends the route. Treatments use infinite query + date preset.
 */
export function useKolamPage(pondCode: string) {
  const dayTable = useServerTableControls({
    pageSize: 25,
    sorting: [{ id: 'date', desc: true }],
  })
  const overrideTable = useServerTableControls({
    sorting: [{ id: 'status', desc: false }],
  })
  const headerQuery = defaultPondHeaderQuery(pondCode)
  const bibisQuery = defaultBibisQuery(pondCode)
  const dayQuery = toPondDayQuery(pondCode, dayTable.state)
  const dadakanQuery = toDadakanQuery(pondCode, overrideTable.state)
  const planQuery = defaultTreatmentPlanQuery(pondCode)
  const header = useSuspenseQuery(kolamHeaderQueryOptions(headerQuery))
  const bibis = useSuspenseQuery(kolamBibisQueryOptions(bibisQuery))
  const days = useQuery(kolamDaysQueryOptions(dayQuery))
  const overrides = useQuery(kolamOverridesQueryOptions(dadakanQuery))
  const treatments = useKolamTreatments(pondCode)
  const treatmentPlan = useQuery(kolamTreatmentPlanQueryOptions(planQuery))
  const treatmentOptions = useQuery(treatmentsQueryOptions())

  return {
    header: header.data,
    bibis: bibis.data,
    days: days.data ?? { rows: [], rowCount: 0 },
    overrides: overrides.data ?? { rows: [], rowCount: 0 },
    treatments,
    treatmentPlan: treatmentPlan.data ?? {
      pondCode,
      treatments: [],
    },
    treatmentOptions: treatmentOptions.data ?? [],
    dayTable,
    overrideTable,
    daysFetching: days.isFetching && days.isPlaceholderData,
    overridesFetching: overrides.isFetching && overrides.isPlaceholderData,
  }
}
