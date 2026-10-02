import { queryOptions } from '@tanstack/react-query'
import { getSession } from '#/features/auth/api/session.functions'

export const sessionQueryKey = ['session'] as const

export function sessionQueryOptions() {
  return queryOptions({
    queryKey: sessionQueryKey,
    queryFn: () => getSession(),
    staleTime: 5 * 60 * 1000,
  })
}
