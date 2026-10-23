import { useEffect, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type {
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/react-table'
import type { ServerTableControls } from '#/components/shared/data-table'
import { useDebouncedValue } from '#/hooks/use-debounced-value'
import {
  defaultPakanSearch,
  resolvePakanSearch,
} from '#/features/pakan/schemas/inventory'
import type { PakanSearch } from '#/features/pakan/schemas/inventory'

const activitySorts = [
  'occurredAt',
  'type',
  'feedName',
  'quantityGrams',
] as const

function applyUpdater<T>(updater: Updater<T>, current: T): T {
  return typeof updater === 'function'
    ? (updater as (old: T) => T)(current)
    : updater
}

/** Drops default search values so `/pakan` stays clean until a filter changes. */
export function compactPakanSearch(
  search: Partial<PakanSearch>,
): Partial<PakanSearch> {
  return {
    ...(search.page != null && search.page !== defaultPakanSearch.page
      ? { page: search.page }
      : {}),
    ...(search.pageSize != null &&
    search.pageSize !== defaultPakanSearch.pageSize
      ? { pageSize: search.pageSize }
      : {}),
    ...(search.q != null && search.q !== defaultPakanSearch.q
      ? { q: search.q }
      : {}),
    ...(search.sort != null && search.sort !== defaultPakanSearch.sort
      ? { sort: search.sort }
      : {}),
    ...(search.desc != null && search.desc !== defaultPakanSearch.desc
      ? { desc: search.desc }
      : {}),
    ...(search.type != null && search.type !== defaultPakanSearch.type
      ? { type: search.type }
      : {}),
    ...(search.feed != null && search.feed !== defaultPakanSearch.feed
      ? { feed: search.feed }
      : {}),
  }
}

/**
 * Riwayat page, sort, and search live in the `/pakan` URL.
 * The search box updates immediately; the URL and the query wait 300ms.
 */
export function usePakanActivityTable(search: PakanSearch): {
  table: ServerTableControls
  setType: (type: PakanSearch['type']) => void
  setFeed: (feedId: string | null) => void
} {
  const navigate = useNavigate({ from: '/pakan' })
  const [draft, setDraft] = useState(search.q)
  const debounced = useDebouncedValue(draft, 300)
  const pendingQuery = useRef<string | null>(null)
  const committedQuery = useRef(search.q)
  committedQuery.current = search.q

  const write = (patch: Partial<PakanSearch>, replace = false) => {
    void navigate({
      to: '/pakan',
      replace,
      search: (prev) =>
        compactPakanSearch({ ...resolvePakanSearch(prev), ...patch }),
    })
  }

  useEffect(() => {
    const query = debounced.slice(0, 60)
    if (query === committedQuery.current) return
    pendingQuery.current = query
    void navigate({
      to: '/pakan',
      replace: true,
      search: (prev) =>
        compactPakanSearch({
          ...resolvePakanSearch(prev),
          q: query,
          page: 0,
        }),
    })
  }, [debounced, navigate])

  useEffect(() => {
    if (pendingQuery.current === search.q) {
      pendingQuery.current = null
      return
    }
    setDraft(search.q)
  }, [search.q])

  const pagination = {
    pageIndex: search.page,
    pageSize: search.pageSize,
  } satisfies PaginationState
  const sorting = [
    { id: search.sort, desc: search.desc },
  ] satisfies SortingState

  const table: ServerTableControls = {
    state: { pagination, sorting, globalFilter: draft },
    onPaginationChange: (updater) => {
      const next = applyUpdater(updater, pagination)
      write({
        page: next.pageSize === search.pageSize ? next.pageIndex : 0,
        pageSize: next.pageSize,
      })
    },
    onSortingChange: (updater) => {
      const next = applyUpdater(updater, sorting)
      const column = next.at(0)
      const sort = activitySorts.find((id) => id === column?.id)
      write({
        sort: sort ?? 'occurredAt',
        desc: column == null || sort == null ? true : column.desc,
        page: 0,
      })
    },
    onGlobalFilterChange: (updater) => {
      setDraft((current) => applyUpdater(updater, current))
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  }

  return {
    table,
    setType: (type) => write({ type, page: 0 }),
    setFeed: (feedId) => write({ feed: feedId ?? '', page: 0 }),
  }
}
