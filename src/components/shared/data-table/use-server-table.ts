import { useState } from 'react'
import type {
  PaginationState,
  SortingState,
  Updater,
} from '@tanstack/react-table'

/** Page size, sort, and search the first server request uses. */
export const initialServerTableState = {
  pagination: { pageIndex: 0, pageSize: 10 } satisfies PaginationState,
  sorting: [] as SortingState,
  globalFilter: '',
}

function applyUpdater<T>(updater: Updater<T>, current: T): T {
  return typeof updater === 'function'
    ? (updater as (old: T) => T)(current)
    : updater
}

/**
 * Owns the slices a server query has to see: page, sort, and global search.
 *
 * Pass the return value into `useAppTable` and into the query key. Other
 * slices (pinning, sizing, visibility, selection) stay inside the table.
 * Search and sort send the user back to the first page.
 */
export function useServerTableControls() {
  const [pagination, setPagination] = useState(
    initialServerTableState.pagination,
  )
  const [sorting, setSorting] = useState(initialServerTableState.sorting)
  const [globalFilter, setGlobalFilter] = useState(
    initialServerTableState.globalFilter,
  )

  const firstPage = () =>
    setPagination((page) =>
      page.pageIndex === 0 ? page : { ...page, pageIndex: 0 },
    )

  return {
    state: { pagination, sorting, globalFilter },
    onPaginationChange: setPagination,
    onSortingChange: (updater: Updater<SortingState>) => {
      setSorting((current) => applyUpdater(updater, current))
      firstPage()
    },
    onGlobalFilterChange: (updater: Updater<string>) => {
      setGlobalFilter((current) => applyUpdater(updater, current))
      firstPage()
    },
    manualPagination: true as const,
    manualSorting: true as const,
    manualFiltering: true as const,
  }
}

export type ServerTableControls = ReturnType<typeof useServerTableControls>
