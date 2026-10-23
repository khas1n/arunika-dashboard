import { useQueryClient } from '@tanstack/react-query'
import type { InfiniteData, QueryKey } from '@tanstack/react-query'
import { useOptimisticMutation } from '#/hooks/use-optimistic-mutation'
import { sessionQueryKey } from '#/features/auth/api/session.queries'
import {
  createFastingOverrideFn,
  createTreatmentLogFn,
  revokeFastingOverrideFn,
  revokeTreatmentLogFn,
  updateTreatmentLogFn,
  upsertPondDayFn,
} from '#/features/pakan/api/kolam.functions'
import { kolamQueryKey } from '#/features/pakan/api/kolam.queries'
import { feedsQueryKey } from '#/features/pakan/api/feed.queries'
import { inventoryQueryKey } from '#/features/pakan/api/inventory.queries'
import {
  cultureDay,
  todayInJakarta,
} from '#/features/pakan/domain/feeding-schedule'
import { zonedDateTime } from '#/features/pakan/domain/zoned-datetime'
import type {
  FastingOverrideInput,
  FastingOverrideItem,
  KolamCycle,
  PondDay,
  PondDayPatch,
  PondDaySave,
  TreatmentLogInput,
  TreatmentLogItem,
  TreatmentLogUpdate,
  TreatmentOption,
} from '#/features/pakan/schemas/kolam'

interface Page<TRow> {
  rows: Array<TRow>
  rowCount: number
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

function isInfinitePage<TRow>(
  value: unknown,
): value is InfiniteData<Page<TRow>, number> {
  return (
    value != null &&
    typeof value === 'object' &&
    'pages' in value &&
    Array.isArray(value.pages) &&
    value.pages.every((page) => isPage<TRow>(page)) &&
    'pageParams' in value &&
    Array.isArray(value.pageParams)
  )
}

function queryNumber(key: QueryKey, field: string, fallback: number) {
  const query = key.at(-1)
  if (query == null || typeof query !== 'object' || !(field in query)) {
    return fallback
  }
  const value = query[field as keyof typeof query]
  return typeof value === 'number' ? value : fallback
}

function queryFlag(key: QueryKey, field: string, fallback: boolean) {
  const query = key.at(-1)
  if (query == null || typeof query !== 'object' || !(field in query)) {
    return fallback
  }
  const value = query[field as keyof typeof query]
  return typeof value === 'boolean' ? value : fallback
}

function compareNullable(
  left: string | number | null,
  right: string | number | null,
  desc: boolean,
) {
  if (left == null && right == null) return 0
  if (left == null) return 1
  if (right == null) return -1
  const order = left < right ? -1 : left > right ? 1 : 0
  return desc ? -order : order
}

function sortValue(row: PondDay, sortId: string): string | number | null {
  const value = row[sortId as keyof PondDay]
  if (typeof value === 'string' || typeof value === 'number') return value
  return null
}

function applyPatch(row: PondDay, values: PondDayPatch): PondDay {
  if (values.kind === 'weight') {
    return { ...row, averageWeightGrams: values.averageWeightGrams }
  }
  if (values.kind === 'deaths') return { ...row, deaths: values.deaths }
  if (values.kind === 'feed') {
    return { ...row, actualFeedGrams: values.actualFeedGrams }
  }
  return {
    ...row,
    averageWeightGrams: values.averageWeightGrams,
    deaths: values.deaths,
    actualFeedGrams: values.actualFeedGrams,
  }
}

function blankDay(values: PondDayPatch, doc: number): PondDay {
  return {
    date: values.date,
    doc,
    averageWeightGrams:
      values.kind === 'weight' || values.kind === 'day'
        ? values.averageWeightGrams
        : null,
    frMin: null,
    frMax: null,
    deaths:
      values.kind === 'deaths' || values.kind === 'day' ? values.deaths : 0,
    population: null,
    biomassGrams: null,
    calculatedFeedGrams: null,
    operationalFeedGrams: null,
    actualFeedGrams:
      values.kind === 'feed' || values.kind === 'day'
        ? values.actualFeedGrams
        : 0,
    fastingReason: null,
  }
}

function patchCycle(cycle: KolamCycle, values: PondDayPatch): KolamCycle {
  if (cycle.id !== values.batchPondId || values.date !== todayInJakarta()) {
    return cycle
  }
  if (values.kind === 'weight') {
    return { ...cycle, todayWeightGrams: values.averageWeightGrams }
  }
  if (values.kind === 'deaths') return { ...cycle, todayDeaths: values.deaths }
  if (values.kind === 'feed') {
    return { ...cycle, todayFeedGrams: values.actualFeedGrams }
  }
  return {
    ...cycle,
    todayWeightGrams: values.averageWeightGrams,
    todayDeaths: values.deaths,
    todayFeedGrams: values.actualFeedGrams,
  }
}

export function useKolamActions(pondCode: string) {
  const queryClient = useQueryClient()

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
        queryKey: [...kolamQueryKey, 'chart'],
      }),
      queryClient.invalidateQueries({
        queryKey: [...kolamQueryKey, 'header'],
      }),
      queryClient.invalidateQueries({ queryKey: feedsQueryKey }),
      queryClient.invalidateQueries({ queryKey: inventoryQueryKey }),
    ])

  const upsert = useOptimisticMutation({
    mutationFn: (values: PondDaySave) => {
      const { notify: _notify, ...patch } = values
      return upsertPondDayFn({ data: patch })
    },
    scope: (values) => `${values.batchPondId}:${values.date}`,
    queryKey: [...kolamQueryKey, 'days'],
    successMessage: (values) => {
      if (values.notify === false) return undefined
      return values.kind === 'day'
        ? 'Catatan harian tersimpan.'
        : 'Catatan tersimpan.'
    },
    errorMessage: 'Catatan harian gagal disimpan.',
    toastOnError: (values) => values.notify !== false,
    invalidate: refreshDay,
    apply: (values) => {
      const snapshots: Array<{ queryKey: QueryKey; data: unknown }> = []
      const dayPages: Array<{ key: QueryKey; data: Page<PondDay> }> = []
      for (const [key, data] of queryClient.getQueriesData({
        queryKey: [...kolamQueryKey, 'days'],
      })) {
        if (pondCodeFrom(key) !== pondCode || !isPage<PondDay>(data)) continue
        dayPages.push({ key, data })
      }
      let cultureStart: string | null = null
      for (const [key, data] of queryClient.getQueriesData({
        queryKey: [...kolamQueryKey, 'header'],
      })) {
        if (pondCodeFrom(key) !== pondCode || !isPage<KolamCycle>(data)) {
          continue
        }
        cultureStart =
          data.rows.find((cycle) => cycle.id === values.batchPondId)
            ?.cultureStart ?? cultureStart
      }
      const doc =
        cultureStart == null ? 0 : cultureDay(cultureStart, values.date)
      const known = dayPages.some((page) =>
        page.data.rows.some((row) => row.date === values.date),
      )

      for (const page of dayPages) {
        snapshots.push({ queryKey: page.key, data: page.data })
        const pageIndex = queryNumber(page.key, 'pageIndex', 0)
        const pageSize = queryNumber(
          page.key,
          'pageSize',
          page.data.rows.length || 25,
        )
        const sortId = (() => {
          const query = page.key.at(-1)
          if (
            query != null &&
            typeof query === 'object' &&
            'sortId' in query &&
            typeof query.sortId === 'string'
          ) {
            return query.sortId
          }
          return 'date'
        })()
        const sortDesc = queryFlag(page.key, 'sortDesc', true)
        const current = page.data.rows.find((row) => row.date === values.date)
        let rows = page.data.rows
        let rowCount = page.data.rowCount
        if (current) {
          rows = page.data.rows.map((row) =>
            row.date === values.date ? applyPatch(row, values) : row,
          )
        } else if (!known) {
          rowCount += 1
          if (pageIndex === 0) {
            rows = [...page.data.rows, blankDay(values, doc)]
              .sort((left, right) => {
                const primary = compareNullable(
                  sortValue(left, sortId),
                  sortValue(right, sortId),
                  sortDesc,
                )
                if (primary !== 0) return primary
                return compareNullable(left.doc, right.doc, false)
              })
              .slice(0, pageSize)
          }
        }
        queryClient.setQueryData(page.key, { ...page.data, rows, rowCount })
      }

      for (const [key, data] of queryClient.getQueriesData({
        queryKey: [...kolamQueryKey, 'header'],
      })) {
        if (pondCodeFrom(key) !== pondCode || !isPage<KolamCycle>(data)) {
          continue
        }
        snapshots.push({ queryKey: key, data })
        queryClient.setQueryData(key, {
          ...data,
          rows: data.rows.map((cycle) => patchCycle(cycle, values)),
        })
      }

      return (latest) => {
        if (!latest) return
        for (const snapshot of snapshots) {
          queryClient.setQueryData(snapshot.queryKey, snapshot.data)
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

  const refreshTreatments = () =>
    queryClient.invalidateQueries({
      queryKey: [...kolamQueryKey, 'treatments'],
    })

  function treatmentOption(treatmentId: string) {
    const options = queryClient.getQueryData<Array<TreatmentOption>>([
      ...kolamQueryKey,
      'treatment-options',
    ])
    return (
      options?.find((row) => row.id === treatmentId) ?? {
        id: treatmentId,
        code: '',
        name: 'Treatment',
      }
    )
  }

  function sessionUserName() {
    const session = queryClient.getQueryData<{
      user: { name: string }
    } | null>(sessionQueryKey)
    return session?.user.name ?? '…'
  }

  function sortTreatmentRows(rows: Array<TreatmentLogItem>) {
    return [...rows].sort((left, right) => {
      const byTime = right.occurredAt.localeCompare(left.occurredAt)
      if (byTime !== 0) return byTime
      return right.id.localeCompare(left.id)
    })
  }

  const createTreatment = useOptimisticMutation({
    mutationFn: (values: TreatmentLogInput & { clientId: string }) =>
      createTreatmentLogFn({
        data: {
          batchPondId: values.batchPondId,
          treatmentId: values.treatmentId,
          quantityGrams: values.quantityGrams,
          date: values.date,
          time: values.time,
          timeZone: values.timeZone,
        },
      }),
    scope: (values) => values.clientId,
    queryKey: [...kolamQueryKey, 'treatments'],
    errorMessage: 'Treatment gagal disimpan.',
    successMessage: 'Treatment tersimpan.',
    invalidate: refreshTreatments,
    apply: (values) => {
      const tempId = `temp-${values.clientId}`
      let occurredAt: string
      try {
        occurredAt = zonedDateTime(
          values.date,
          values.time,
          values.timeZone,
        ).toISOString()
      } catch {
        occurredAt = new Date().toISOString()
      }
      const option = treatmentOption(values.treatmentId)
      const temp: TreatmentLogItem = {
        id: tempId,
        treatmentId: values.treatmentId,
        treatmentCode: option.code,
        treatmentName: option.name,
        quantityGrams: values.quantityGrams,
        occurredAt,
        userName: sessionUserName(),
      }
      const touched: Array<QueryKey> = []
      for (const [key, data] of queryClient.getQueriesData({
        queryKey: [...kolamQueryKey, 'treatments'],
      })) {
        if (pondCodeFrom(key) !== pondCode) continue
        if (isInfinitePage<TreatmentLogItem>(data)) {
          touched.push(key)
          const pageSize = data.pages.at(0)?.rows.length || 20
          queryClient.setQueryData(key, {
            ...data,
            pages: data.pages.map((page, index) => ({
              rowCount: page.rowCount + 1,
              rows:
                index === 0
                  ? sortTreatmentRows([temp, ...page.rows]).slice(0, pageSize)
                  : page.rows,
            })),
          })
          continue
        }
        if (!isPage<TreatmentLogItem>(data)) continue
        const pageIndex = queryNumber(key, 'pageIndex', 0)
        const pageSize = queryNumber(key, 'pageSize', data.rows.length || 25)
        touched.push(key)
        queryClient.setQueryData(key, {
          rowCount: data.rowCount + 1,
          rows:
            pageIndex === 0
              ? sortTreatmentRows([temp, ...data.rows]).slice(0, pageSize)
              : data.rows,
        })
      }
      return (latest) => {
        if (!latest) return
        for (const key of touched) {
          const data = queryClient.getQueryData(key)
          if (isInfinitePage<TreatmentLogItem>(data)) {
            queryClient.setQueryData(key, {
              ...data,
              pages: data.pages.map((page) => {
                const rows = page.rows.filter((row) => row.id !== tempId)
                return {
                  rows,
                  rowCount:
                    rows.length === page.rows.length
                      ? page.rowCount
                      : Math.max(0, page.rowCount - 1),
                }
              }),
            })
            continue
          }
          if (!isPage<TreatmentLogItem>(data)) continue
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

  const updateTreatment = useOptimisticMutation({
    mutationFn: (values: TreatmentLogUpdate) =>
      updateTreatmentLogFn({ data: values }),
    scope: (values) => values.id,
    queryKey: [...kolamQueryKey, 'treatments'],
    errorMessage: 'Treatment gagal diubah.',
    successMessage: 'Treatment diubah.',
    invalidate: refreshTreatments,
    apply: (values) => {
      let occurredAt: string
      try {
        occurredAt = zonedDateTime(
          values.date,
          values.time,
          values.timeZone,
        ).toISOString()
      } catch {
        occurredAt = new Date().toISOString()
      }
      const option = treatmentOption(values.treatmentId)
      const patch = (row: TreatmentLogItem): TreatmentLogItem =>
        row.id === values.id
          ? {
              ...row,
              treatmentId: values.treatmentId,
              treatmentCode: option.code,
              treatmentName: option.name,
              quantityGrams: values.quantityGrams,
              occurredAt,
            }
          : row
      const snapshots: Array<{ queryKey: QueryKey; data: unknown }> = []
      for (const [key, data] of queryClient.getQueriesData({
        queryKey: [...kolamQueryKey, 'treatments'],
      })) {
        if (pondCodeFrom(key) !== pondCode) continue
        if (isInfinitePage<TreatmentLogItem>(data)) {
          if (!data.pages.some((page) => page.rows.some((row) => row.id === values.id))) {
            continue
          }
          snapshots.push({ queryKey: key, data })
          queryClient.setQueryData(key, {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              rows: sortTreatmentRows(page.rows.map(patch)),
            })),
          })
          continue
        }
        if (!isPage<TreatmentLogItem>(data)) continue
        if (!data.rows.some((row) => row.id === values.id)) continue
        snapshots.push({ queryKey: key, data })
        const pageSize = queryNumber(key, 'pageSize', data.rows.length || 25)
        queryClient.setQueryData(key, {
          ...data,
          rows: sortTreatmentRows(data.rows.map(patch)).slice(0, pageSize),
        })
      }
      return (latest) => {
        if (!latest) return
        for (const snapshot of snapshots) {
          queryClient.setQueryData(snapshot.queryKey, snapshot.data)
        }
      }
    },
  })

  const revokeTreatment = useOptimisticMutation({
    mutationFn: (id: string) => revokeTreatmentLogFn({ data: { id } }),
    scope: (id) => id,
    queryKey: [...kolamQueryKey, 'treatments'],
    errorMessage: 'Treatment gagal dihapus.',
    successMessage: 'Treatment dihapus.',
    invalidate: refreshTreatments,
    apply: (id) => {
      const snapshots: Array<{ queryKey: QueryKey; data: unknown }> = []
      for (const [key, data] of queryClient.getQueriesData({
        queryKey: [...kolamQueryKey, 'treatments'],
      })) {
        if (pondCodeFrom(key) !== pondCode) continue
        if (isInfinitePage<TreatmentLogItem>(data)) {
          if (!data.pages.some((page) => page.rows.some((row) => row.id === id))) {
            continue
          }
          snapshots.push({ queryKey: key, data })
          queryClient.setQueryData(key, {
            ...data,
            pages: data.pages.map((page) => ({
              rows: page.rows.filter((row) => row.id !== id),
              rowCount: Math.max(0, page.rowCount - 1),
            })),
          })
          continue
        }
        if (!isPage<TreatmentLogItem>(data)) continue
        if (!data.rows.some((row) => row.id === id)) continue
        snapshots.push({ queryKey: key, data })
        queryClient.setQueryData(key, {
          rows: data.rows.filter((row) => row.id !== id),
          rowCount: Math.max(0, data.rowCount - 1),
        })
      }
      return (latest) => {
        if (!latest) return
        for (const snapshot of snapshots) {
          queryClient.setQueryData(snapshot.queryKey, snapshot.data)
        }
      }
    },
  })

  return {
    createOverride: (values: FastingOverrideInput) =>
      create.mutateAsync({ ...values, clientId: crypto.randomUUID() }),
    revokeOverride: revoke.mutateAsync,
    upsertDay: upsert.mutateAsync,
    createTreatmentLog: (values: TreatmentLogInput) =>
      createTreatment.mutateAsync({
        ...values,
        clientId: crypto.randomUUID(),
      }),
    updateTreatmentLog: updateTreatment.mutateAsync,
    revokeTreatmentLog: revokeTreatment.mutateAsync,
  }
}
