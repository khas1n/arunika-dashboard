import { queryOptions } from '@tanstack/react-query'
import { getDashboardSummaryFn } from '#/features/dashboard/api/dashboard.functions'

export function dashboardSummaryQueryOptions() {
  return queryOptions({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => getDashboardSummaryFn(),
    staleTime: 30_000,
  })
}
