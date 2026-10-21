import type { FC } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Empty, EmptyHeader, EmptyTitle } from '#/components/ui/empty'
import { formatGrams } from '#/features/pakan/components/pond-log/format-pond'
import { TreatmentLogSkeleton } from '#/features/pakan/components/pond-log/treatment-log/treatment-log-skeleton'
import { treatmentBadgeVariant } from '#/features/pakan/domain/treatment-badge'
import { groupTreatmentLogs } from '#/features/pakan/domain/treatment-log-groups'
import {
  browserTimeZone,
  formatZonedTime,
} from '#/features/pakan/domain/zoned-datetime'
import type { TreatmentLogItem } from '#/features/pakan/schemas/kolam'
import { cn } from '#/lib/utils'

interface TreatmentLogTimelineProps {
  rows: Array<TreatmentLogItem>
  isFetching?: boolean
  isPending?: boolean
  onEdit: (row: TreatmentLogItem) => void
  onRevoke: (row: TreatmentLogItem) => void
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
}

export const TreatmentLogTimeline: FC<TreatmentLogTimelineProps> = ({
  rows,
  isFetching = false,
  isPending = false,
  onEdit,
  onRevoke,
}) => {
  const timeZone = browserTimeZone()
  const groups = groupTreatmentLogs(rows, timeZone)

  if (isPending || (isFetching && rows.length === 0)) {
    return <TreatmentLogSkeleton />
  }

  if (rows.length === 0) {
    return (
      <Empty className="border-0 py-16">
        <EmptyHeader>
          <EmptyTitle className="text-base font-medium">
            Belum ada treatment
          </EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div
      className={cn('grid gap-8', isFetching && 'opacity-60')}
      aria-busy={isFetching || undefined}
    >
      {groups.map((group) => (
        <section key={group.date} className="grid gap-1">
          <h3 className="px-3 pb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {group.label}
          </h3>
          <ul className="relative grid">
            {group.items.length > 1 ? (
              <span
                aria-hidden
                className="pointer-events-none absolute top-5 bottom-5 left-21 w-px -translate-x-1/2 bg-border"
              />
            ) : null}
            {group.items.map((row) => {
              const time = formatZonedTime(new Date(row.occurredAt), timeZone)
              const badgeVariant = treatmentBadgeVariant({
                code: row.treatmentCode,
                name: row.treatmentName,
                id: row.treatmentId,
              })
              return (
                <li key={row.id} className="group">
                  <div className="grid grid-cols-[3rem_1.5rem_minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50">
                    <time
                      dateTime={row.occurredAt}
                      className="text-right text-xs leading-none tabular-nums text-muted-foreground"
                    >
                      {time}
                    </time>
                    <div className="relative z-10 flex items-center justify-center">
                      <Avatar
                        size="sm"
                        className="border border-border bg-card"
                      >
                        <AvatarFallback className="bg-muted text-[10px] font-semibold leading-none text-muted-foreground">
                          {initials(row.userName)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 text-sm leading-none">
                      <span className="font-semibold text-foreground">
                        {row.userName}
                      </span>
                      <span className="text-muted-foreground">menambahkan</span>
                      <Badge variant={badgeVariant} size="xs">
                        {row.treatmentName}
                      </Badge>
                      <Badge
                        variant="outline"
                        size="xs"
                        className="font-normal"
                      >
                        {formatGrams(row.quantityGrams)} g
                      </Badge>
                    </div>
                    <div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Ubah ${row.treatmentName}`}
                        onClick={() => onEdit(row)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Hapus ${row.treatmentName}`}
                        onClick={() => onRevoke(row)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
