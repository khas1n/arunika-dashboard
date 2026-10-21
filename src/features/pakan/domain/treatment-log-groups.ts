import {
  formatZonedDate,
  todayInZone,
} from '#/features/pakan/domain/zoned-datetime'
import type { TreatmentLogItem } from '#/features/pakan/schemas/kolam'

export interface TreatmentLogGroup {
  /** Calendar day `YYYY-MM-DD` in `timeZone`. */
  date: string
  label: string
  items: Array<TreatmentLogItem>
}

function addCalendarDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day + days))
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, '0')}-${String(utc.getUTCDate()).padStart(2, '0')}`
}

function formatGroupLabel(date: string, timeZone: string, now: Date): string {
  const today = todayInZone(timeZone, now)
  if (date === today) return 'Hari ini'
  if (date === addCalendarDays(today, -1)) return 'Kemarin'
  const instant = new Date(`${date}T12:00:00.000Z`)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(instant)
}

/**
 * Group active log rows by calendar day in `timeZone`.
 * Caller must already sort by `occurredAt` desc (then `id`).
 */
export function groupTreatmentLogs(
  rows: Array<TreatmentLogItem>,
  timeZone: string,
  now = new Date(),
): Array<TreatmentLogGroup> {
  const groups: Array<TreatmentLogGroup> = []
  for (const row of rows) {
    const date = formatZonedDate(new Date(row.occurredAt), timeZone)
    const last = groups.at(-1)
    if (last && last.date === date) {
      last.items.push(row)
      continue
    }
    groups.push({
      date,
      label: formatGroupLabel(date, timeZone, now),
      items: [row],
    })
  }
  return groups
}
