import { useEffect, useRef } from 'react'
import type { FC } from 'react'
import type { DateRange } from '@daypicker/react'
import { Plus } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardTitle } from '#/components/ui/card'
import { Spinner } from '#/components/ui/spinner'
import { TreatmentLogToolbar } from '#/features/pakan/components/pond-log/treatment-log/treatment-log-toolbar'
import { TreatmentLogTimeline } from '#/features/pakan/components/pond-log/treatment-log/treatment-log-timeline'
import { treatmentBadgeVariant } from '#/features/pakan/domain/treatment-badge'
import type {
  TreatmentLogItem,
  TreatmentOption,
} from '#/features/pakan/schemas/kolam'

interface TreatmentLogPanelProps {
  plannedTreatments: Array<TreatmentOption>
  rows: Array<TreatmentLogItem>
  isPending?: boolean
  isFetching?: boolean
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  onFetchNextPage: () => void
  range: DateRange | null
  onRangeChange: (range: DateRange | null) => void
  onCreate: () => void
  onEdit: (row: TreatmentLogItem) => void
  onRevoke: (row: TreatmentLogItem) => void
}

export const TreatmentLogPanel: FC<TreatmentLogPanelProps> = ({
  plannedTreatments,
  rows,
  isPending = false,
  isFetching = false,
  isFetchingNextPage = false,
  hasNextPage = false,
  onFetchNextPage,
  range,
  onRangeChange,
  onCreate,
  onEdit,
  onRevoke,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasNextPage) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onFetchNextPage()
      },
      { rootMargin: '200px 0px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [hasNextPage, onFetchNextPage, rows.length])

  return (
    <Card className="min-w-0 gap-0 overflow-hidden border-border/80 py-0 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
        <div className="flex min-w-0 flex-wrap items-center gap-2.5">
          <CardTitle className="text-xl font-semibold tracking-tight">
            Treatment
          </CardTitle>
          {plannedTreatments.map((treatment) => (
            <Badge
              key={treatment.id}
              variant={treatmentBadgeVariant({
                code: treatment.code,
                name: treatment.name,
                id: treatment.id,
              })}
              size="xs"
            >
              {treatment.name}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <TreatmentLogToolbar range={range} onRangeChange={onRangeChange} />
          <Button type="button" onClick={onCreate}>
            <Plus data-icon="inline-start" />
            Catat
          </Button>
        </div>
      </div>

      <CardContent className="grid gap-2 px-5 py-6 sm:px-6">
        <TreatmentLogTimeline
          rows={rows}
          isPending={isPending}
          isFetching={isFetching}
          onEdit={onEdit}
          onRevoke={onRevoke}
        />
        <div ref={sentinelRef} className="h-4" aria-hidden />
        {isFetchingNextPage ? (
          <div className="flex justify-center py-3">
            <Spinner />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
