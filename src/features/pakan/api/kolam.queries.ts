import { queryOptions } from '@tanstack/react-query'
import { getKolamLogFn } from '#/features/pakan/api/kolam.functions'
import { kolamLogSchema } from '#/features/pakan/schemas/kolam'

export const kolamQueryKey = ['pakan', 'kolam'] as const

export function kolamQueryOptions(batchPondId?: string) {
  return queryOptions({
    queryKey: [...kolamQueryKey, batchPondId ?? null],
    queryFn: async () =>
      kolamLogSchema.parse(await getKolamLogFn({ data: { batchPondId } })),
  })
}
