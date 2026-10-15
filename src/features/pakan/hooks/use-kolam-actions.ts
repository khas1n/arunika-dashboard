import { useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { QueryKey } from '@tanstack/react-query'
import { useOptimisticMutation } from '#/hooks/use-optimistic-mutation'
import {
  createFastingOverrideFn,
  revokeFastingOverrideFn,
  upsertPondDayFn,
} from '#/features/pakan/api/kolam.functions'
import { kolamQueryKey } from '#/features/pakan/api/kolam.queries'
import { feedsQueryKey } from '#/features/pakan/api/feed.queries'
import type {
  FastingOverrideInput,
  FastingOverrideItem,
  PondDay,
  PondDayWrite,
} from '#/features/pakan/schemas/kolam'

interface Page<TRow> {
  rows: Array<TRow>
  rowCount: number
}

interface DayBaseline {
  queryKey: QueryKey
  previous: Pick<
    PondDay,
    'averageWeightGrams' | 'frMin' | 'frMax' | 'deaths' | 'actualFeedGrams'
  >
}

function pondCodeFrom(key: QueryKey) {
  const query = key.at(-1)
  if (query == null || typeof query !== 'object' || !('pondCode' in query)) {
    return null
  }
  return typeof query.pondCode === 'string' ? query.pondCode : null
}

function isPage<TRow>(value: unknown): value is Page<TRow> {
  return (
    value != null &&
    typeof value === 'object' &&
    'rows' in value &&
    Array.isArray(value.rows) &&
    'rowCount' in value &&
    typeof value.rowCount === 'number'
  )
}

export function useKolamActions(pondCode: string) {
  const queryClient = useQueryClient()
  const dayBaselines = useRef(new Map<string, Array<DayBaseline>>())

  const refreshOverrides = () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: [...kolamQueryKey, 'overrides'],
      }),
      queryClient.invalidateQueries({ queryKey: [...kolamQueryKey, 'days'] }),
      queryClient.invalidateQueries({ queryKey: [...kolamQueryKey, 'bibis'] }),
    ])

  const refreshDay = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [...kolamQueryKey, 'days'] }),
      queryClient.invalidateQueries({ queryKey: [...kolamQueryKey, 'bibis'] }),
      queryClient.invalidateQueries({
        queryKey: [...kolamQueryKey, 'biomass'],
      }),
      queryClient.invalidateQueries({
        queryKey: [...kolamQueryKey, 'header'],
      }),
      queryClient.invalidateQueries({ queryKey: feedsQueryKey }),
    ])

  const upsert = useOptimisticMutation({
    mutationFn: (values: PondDayWrite) => upsertPondDayFn({ data: values }),
    scope: (values) => `${values.batchPondId}:${values.date}`,
    queryKey: [...kolamQueryKey, 'days'],
    successMessage: (values) =>
      values.create ? 'Catatan harian tersimpan.' : undefined,
    errorMessage: 'Catatan harian gagal disimpan.',
    toastOnError: (values) => values.create,
    invalidate: refreshDay,
    accept: (values) => {
      dayBaselines.current.delete(`${values.batchPondId}:${values.date}`)
    },
    apply: (values) => {
      const scope = `${values.batchPondId}:${values.date}`
      if (!values.create && !dayBaselines.current.has(scope)) {
        const baselines: Array<DayBaseline> = []
        for (const [key, data] of queryClient.getQueriesData({
          queryKey: [...kolamQueryKey, 'days'],
        })) {
          if (pondCodeFrom(key) !== pondCode || !isPage<PondDay>(data)) continue
          const row = data.rows.find((item) => item.date === values.date)
          if (!row) continue
          baselines.push({
            queryKey: key,
            previous: {
              averageWeightGrams: row.averageWeightGrams,
              frMin: row.frMin,
              frMax: row.frMax,
              deaths: row.deaths,
              actualFeedGrams: row.actualFeedGrams,
            },
          })
        }
        dayBaselines.current.set(scope, baselines)
      }
      if (!values.create) {
        for (const [key, data] of queryClient.getQueriesData({
          queryKey: [...kolamQueryKey, 'days'],
        })) {
          if (pondCodeFrom(key) !== pondCode || !isPage<PondDay>(data)) continue
          queryClient.setQueryData(key, {
            ...data,
            rows: data.rows.map((row) =>
              row.date === values.date
                ? {
                    ...row,
                    averageWeightGrams: values.averageWeightGrams,
                    frMin: values.frMin,
                    frMax: values.frMax,
                    deaths: values.deaths,
                    actualFeedGrams: values.actualFeedGrams,
                  }
                : row,
            ),
          })
        }
      }
      return (latest) => {
        if (!latest) return
        const baselines = dayBaselines.current.get(scope) ?? []
        dayBaselines.current.delete(scope)
        for (const baseline of baselines) {
          const data = queryClient.getQueryData(baseline.queryKey)
          if (!isPage<PondDay>(data)) continue
          queryClient.setQueryData(baseline.queryKey, {
            ...data,
            rows: data.rows.map((row) =>
              row.date === values.date ? { ...row, ...baseline.previous } : row,
            ),
          })
        }
      }
    },
  })

  const create = useOptimisticMutation({
    mutationFn: (values: FastingOverrideInput & { clientId: string }) =>
      createFastingOverrideFn({
        data: {
          batchPondId: values.batchPondId,
          startsOn: values.startsOn,
          endsOn: values.endsOn,
          reason: values.reason,
          note: values.note,
        },
      }),
    scope: (values) => values.clientId,
    queryKey: [...kolamQueryKey, 'overrides'],
    errorMessage: 'Puasa dadakan gagal disimpan.',
    successMessage: 'Puasa dadakan tersimpan.',
    invalidate: refreshOverrides,
    apply: (values) => {
      const tempId = `temp-${values.clientId}`
      const temp: FastingOverrideItem = {
        id: tempId,
        startsOn: values.startsOn,
        endsOn: values.endsOn,
        reason: values.reason,
        note: values.note === '' ? null : values.note,
        ended: false,
      }
      const touched: Array<QueryKey> = []
      for (const [key, data] of queryClient.getQueriesData({
        queryKey: [...kolamQueryKey, 'overrides'],
      })) {
        if (
          pondCodeFrom(key) !== pondCode ||
          !isPage<FastingOverrideItem>(data)
        ) {
          continue
        }
        const query = key.at(-1)
        const pageIndex =
          query != null &&
          typeof query === 'object' &&
          'pageIndex' in query &&
          typeof query.pageIndex === 'number'
            ? query.pageIndex
            : 0
        touched.push(key)
        queryClient.setQueryData(key, {
          rowCount: data.rowCount + 1,
          rows:
            pageIndex === 0
              ? [temp, ...data.rows].slice(0, data.rows.length || 1)
              : data.rows,
        })
      }
      return (latest) => {
        if (!latest) return
        for (const key of touched) {
          const data = queryClient.getQueryData(key)
          if (!isPage<FastingOverrideItem>(data)) continue
          const rows = data.rows.filter((row) => row.id !== tempId)
          queryClient.setQueryData(key, {
            rows,
            rowCount:
              rows.length === data.rows.length
                ? data.rowCount
                : Math.max(0, data.rowCount - 1),
          })
        }
      }
    },
  })

  const revoke = useOptimisticMutation({
    mutationFn: (id: string) => revokeFastingOverrideFn({ data: { id } }),
    scope: (id) => id,
    queryKey: [...kolamQueryKey, 'overrides'],
    errorMessage: 'Puasa dadakan gagal diakhiri.',
    successMessage: 'Puasa dadakan diakhiri.',
    invalidate: refreshOverrides,
    apply: (id) => {
      const snapshots: Array<{
        queryKey: QueryKey
        rows: Array<FastingOverrideItem>
      }> = []
      for (const [key, data] of queryClient.getQueriesData({
        queryKey: [...kolamQueryKey, 'overrides'],
      })) {
        if (
          pondCodeFrom(key) !== pondCode ||
          !isPage<FastingOverrideItem>(data)
        ) {
          continue
        }
        if (!data.rows.some((row) => row.id === id)) continue
        snapshots.push({ queryKey: key, rows: data.rows })
        queryClient.setQueryData(key, {
          ...data,
          rows: data.rows.map((row) =>
            row.id === id ? { ...row, ended: true } : row,
          ),
        })
      }
      return (latest) => {
        if (!latest) return
        for (const snapshot of snapshots) {
          const data = queryClient.getQueryData(snapshot.queryKey)
          if (!isPage<FastingOverrideItem>(data)) continue
          queryClient.setQueryData(snapshot.queryKey, {
            ...data,
            rows: snapshot.rows,
          })
        }
      }
    },
  })

  return {
    createOverride: (values: FastingOverrideInput) =>
      create.mutateAsync({ ...values, clientId: crypto.randomUUID() }),
    revokeOverride: revoke.mutateAsync,
    upsertDay: upsert.mutateAsync,
  }
}
