import {
  keepPreviousData,
  infiniteQueryOptions,
  queryOptions,
} from '@tanstack/react-query'
import {
  getKolamHeaderFn,
  getKolamTreatmentPlanFn,
  listKolamBibisFn,
  listKolamChartFn,
  listKolamDaysFn,
  listKolamOverridesFn,
  listKolamPondsFn,
  listKolamTreatmentsFn,
  listTreatmentsFn,
} from '#/features/pakan/api/kolam.functions'
import {
  addCalendarDays,
  browserTimeZone,
  todayInZone,
} from '#/features/pakan/domain/zoned-datetime'
import {
  bibisPageSchema,
  kolamChartSchema,
  dadakanPageSchema,
  dadakanSortSchema,
  pondDayPageSchema,
  pondDaySortSchema,
  pondHeaderSchema,
  pondListSchema,
  treatmentLogPageSchema,
  treatmentOptionsSchema,
  treatmentPlanSchema,
} from '#/features/pakan/schemas/kolam'
import type {
  BibisQuery,
  KolamChartQuery,
  DadakanQuery,
  PondDayQuery,
  PondHeaderQuery,
  PondListQuery,
  TreatmentLogQuery,
  TreatmentPlanQuery,
} from '#/features/pakan/schemas/kolam'
import type { ServerTableControls } from '#/components/shared/data-table'

export const kolamQueryKey = ['pakan', 'kolam'] as const

export const defaultPondListQuery = {
  pageIndex: 0,
  pageSize: 100,
  sortId: 'batch',
  sortDesc: false,
} satisfies PondListQuery

export function defaultPondHeaderQuery(pondCode: string): PondHeaderQuery {
  return {
    pondCode,
    pageIndex: 0,
    pageSize: 1,
    sortId: 'pondCode',
    sortDesc: false,
  }
}

export function defaultBibisQuery(pondCode: string): BibisQuery {
  return {
    pondCode,
    pageIndex: 0,
    pageSize: 10,
    sortId: 'feedingOn',
    sortDesc: false,
  }
}

export function defaultDadakanQuery(pondCode: string): DadakanQuery {
  return {
    pondCode,
    pageIndex: 0,
    pageSize: 10,
    sortId: 'status',
    sortDesc: false,
  }
}

export function defaultPondDayQuery(pondCode: string): PondDayQuery {
  return {
    pondCode,
    pageIndex: 0,
    pageSize: 25,
    sortId: 'date',
    sortDesc: true,
  }
}

export function toPondDayQuery(
  pondCode: string,
  state: ServerTableControls['state'],
): PondDayQuery {
  const sort = state.sorting.at(0)
  const sortId = pondDaySortSchema.safeParse(sort?.id).data ?? 'date'
  return {
    pondCode,
    pageIndex: state.pagination.pageIndex,
    pageSize: state.pagination.pageSize,
    sortId,
    sortDesc: sort?.desc ?? false,
  }
}

export function toDadakanQuery(
  pondCode: string,
  state: ServerTableControls['state'],
): DadakanQuery {
  const sort = state.sorting.at(0)
  const sortId = dadakanSortSchema.safeParse(sort?.id).data ?? 'status'
  return {
    pondCode,
    pageIndex: state.pagination.pageIndex,
    pageSize: state.pagination.pageSize,
    sortId,
    sortDesc: sort?.desc ?? false,
  }
}

export type TreatmentLogFilter = {
  from?: string
  to?: string
  timeZone?: string
}

export function defaultTreatmentLogQuery(
  pondCode: string,
  filter: TreatmentLogFilter = {},
): TreatmentLogQuery {
  return {
    pondCode,
    pageIndex: 0,
    pageSize: 20,
    sortId: 'occurredAt',
    sortDesc: true,
    ...filter,
  }
}

/** Last 30 calendar days in the browser zone (inclusive). */
export function defaultTreatmentInfiniteFilter(): TreatmentLogFilter {
  const timeZone = browserTimeZone()
  const today = todayInZone(timeZone)
  return {
    from: addCalendarDays(today, -29),
    to: today,
    timeZone,
  }
}

export function treatmentFilterFromRange(range: {
  from?: string
  to?: string
} | null): TreatmentLogFilter {
  if (range?.from == null || range.to == null) return {}
  return {
    from: range.from,
    to: range.to,
    timeZone: browserTimeZone(),
  }
}

export function treatmentLogInfiniteKey(
  pondCode: string,
  filter: TreatmentLogFilter = {},
) {
  return [
    ...kolamQueryKey,
    'treatments',
    'infinite',
    {
      pondCode,
      pageSize: 20,
      sortId: 'occurredAt' as const,
      sortDesc: true,
      ...filter,
    },
  ] as const
}

export function defaultTreatmentPlanQuery(
  pondCode: string,
): TreatmentPlanQuery {
  return { pondCode }
}

export function kolamPondsQueryOptions(query: PondListQuery) {
  return queryOptions({
    queryKey: [...kolamQueryKey, 'ponds', query],
    queryFn: async () =>
      pondListSchema.parse(await listKolamPondsFn({ data: query })),
  })
}

export function kolamHeaderQueryOptions(query: PondHeaderQuery) {
  return queryOptions({
    queryKey: [...kolamQueryKey, 'header', query],
    queryFn: async () =>
      pondHeaderSchema.parse(await getKolamHeaderFn({ data: query })),
  })
}

export function kolamBibisQueryOptions(query: BibisQuery) {
  return queryOptions({
    queryKey: [...kolamQueryKey, 'bibis', query],
    queryFn: async () =>
      bibisPageSchema.parse(await listKolamBibisFn({ data: query })),
  })
}

export function kolamChartQueryOptions(query: KolamChartQuery) {
  return queryOptions({
    queryKey: [...kolamQueryKey, 'chart', query] as const,
    queryFn: async () =>
      kolamChartSchema.parse(await listKolamChartFn({ data: query })),
    placeholderData: keepPreviousData,
  })
}

export function kolamDaysQueryOptions(query: PondDayQuery) {
  return queryOptions({
    queryKey: [...kolamQueryKey, 'days', query],
    queryFn: async () =>
      pondDayPageSchema.parse(await listKolamDaysFn({ data: query })),
    placeholderData: keepPreviousData,
  })
}

export function kolamOverridesQueryOptions(query: DadakanQuery) {
  return queryOptions({
    queryKey: [...kolamQueryKey, 'overrides', query],
    queryFn: async () =>
      dadakanPageSchema.parse(await listKolamOverridesFn({ data: query })),
    placeholderData: keepPreviousData,
  })
}

export function treatmentsQueryOptions() {
  return queryOptions({
    queryKey: [...kolamQueryKey, 'treatment-options'],
    queryFn: async () =>
      treatmentOptionsSchema.parse(await listTreatmentsFn()),
  })
}

export function kolamTreatmentPlanQueryOptions(query: TreatmentPlanQuery) {
  return queryOptions({
    queryKey: [...kolamQueryKey, 'treatment-plan', query],
    queryFn: async () =>
      treatmentPlanSchema.parse(await getKolamTreatmentPlanFn({ data: query })),
  })
}

export function kolamTreatmentsQueryOptions(query: TreatmentLogQuery) {
  return queryOptions({
    queryKey: [...kolamQueryKey, 'treatments', query],
    queryFn: async () =>
      treatmentLogPageSchema.parse(
        await listKolamTreatmentsFn({ data: query }),
      ),
    placeholderData: keepPreviousData,
  })
}

export function kolamTreatmentsInfiniteOptions(
  pondCode: string,
  filter: TreatmentLogFilter = {},
) {
  const base = {
    pondCode,
    pageSize: 20,
    sortId: 'occurredAt' as const,
    sortDesc: true,
    ...filter,
  }
  return infiniteQueryOptions({
    queryKey: treatmentLogInfiniteKey(pondCode, filter),
    queryFn: async ({ pageParam }) =>
      treatmentLogPageSchema.parse(
        await listKolamTreatmentsFn({
          data: { ...base, pageIndex: pageParam },
        }),
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const loaded = pages.reduce((sum, page) => sum + page.rows.length, 0)
      return loaded < lastPage.rowCount ? pages.length : undefined
    },
  })
}
