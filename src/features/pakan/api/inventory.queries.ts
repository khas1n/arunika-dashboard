import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import {
  listInventoryActivityFn,
  listInventoryOverviewFn,
} from '#/features/pakan/api/inventory.functions'
import {
  activityPageSchema,
  inventoryOverviewSchema,
} from '#/features/pakan/schemas/inventory'
import type { ActivityQuery } from '#/features/pakan/schemas/inventory'

export const inventoryQueryKey = ['pakan', 'inventory'] as const

export function inventoryOverviewQueryOptions() {
  return queryOptions({
    queryKey: [...inventoryQueryKey, 'overview'],
    queryFn: async () =>
      inventoryOverviewSchema.parse(await listInventoryOverviewFn()),
    staleTime: 15_000,
  })
}

export function inventoryActivityQueryOptions(query: ActivityQuery) {
  return queryOptions({
    queryKey: [...inventoryQueryKey, 'activity', query],
    queryFn: async () =>
      activityPageSchema.parse(await listInventoryActivityFn({ data: query })),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })
}
