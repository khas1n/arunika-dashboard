import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import {
  getKolamHeaderFn,
  listKolamBibisFn,
  listKolamBiomassFn,
  listKolamDaysFn,
  listKolamOverridesFn,
  listKolamPondsFn,
} from '#/features/pakan/api/kolam.functions'
import {
  bibisPageSchema,
  biomassSeriesSchema,
  dadakanPageSchema,
  dadakanSortSchema,
  pondDayPageSchema,
  pondDaySortSchema,
  pondHeaderSchema,
  pondListSchema,
} from '#/features/pakan/schemas/kolam'
import type {
  BibisQuery,
  BiomassSeriesQuery,
  DadakanQuery,
  PondDayQuery,
  PondHeaderQuery,
  PondListQuery,
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
    pageSize: 10,
    sortId: 'date',
    sortDesc: false,
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

export function kolamBiomassQueryOptions(query: BiomassSeriesQuery) {
  return queryOptions({
    queryKey: [...kolamQueryKey, 'biomass', query.pondCode],
    queryFn: async () =>
      biomassSeriesSchema.parse(await listKolamBiomassFn({ data: query })),
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
