import { useCallback, useMemo, useState } from 'react'
import type { DateRange } from '@daypicker/react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { format, parse } from 'date-fns'
import {
  kolamTreatmentsInfiniteOptions,
  treatmentFilterFromRange,
} from '#/features/pakan/api/kolam.queries'
import {
  addCalendarDays,
  browserTimeZone,
  todayInZone,
} from '#/features/pakan/domain/zoned-datetime'

function parseDay(value: string) {
  return parse(value, 'yyyy-MM-dd', new Date())
}

function rangeToDays(range: DateRange | null) {
  if (range?.from == null || range.to == null) return null
  return {
    from: format(range.from, 'yyyy-MM-dd'),
    to: format(range.to, 'yyyy-MM-dd'),
  }
}

/** Last 30 days as a DateRange (Storybook / tests that need a filled filter). */
export function defaultTreatmentDateRange(): DateRange {
  const timeZone = browserTimeZone()
  const today = todayInZone(timeZone)
  return {
    from: parseDay(addCalendarDays(today, -29)),
    to: parseDay(today),
  }
}

export function useKolamTreatments(pondCode: string) {
  const [range, setRange] = useState<DateRange | null>(null)
  const filter = useMemo(
    () => treatmentFilterFromRange(rangeToDays(range)),
    [range],
  )

  const setTreatmentRange = useCallback((next: DateRange | null) => {
    setRange((current) => {
      const currentDays = rangeToDays(current)
      const nextDays = rangeToDays(next)
      if (
        currentDays?.from === nextDays?.from &&
        currentDays?.to === nextDays?.to
      ) {
        return current
      }
      if (currentDays == null && nextDays == null) return current
      return next
    })
  }, [])
  const query = useInfiniteQuery(
    kolamTreatmentsInfiniteOptions(pondCode, filter),
  )
  const rows = useMemo(
    () => query.data?.pages.flatMap((page) => page.rows) ?? [],
    [query.data],
  )
  const rowCount = query.data?.pages.at(0)?.rowCount ?? 0
  const fetchNextPage = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage()
    }
  }, [query])

  return {
    rows,
    rowCount,
    range,
    setRange: setTreatmentRange,
    filter,
    isPending: query.isPending,
    isFetching: query.isFetching && !query.isFetchingNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: Boolean(query.hasNextPage),
    fetchNextPage,
  }
}
