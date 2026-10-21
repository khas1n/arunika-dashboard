/**
 * Wall-clock date + time in a named IANA zone → UTC Instant.
 * Used by TreatmentLog writes. Calendar days for Harian stay on Jakarta helpers.
 */

export type CalendarDate = string
export type ClockTime = string

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** True when `timeZone` is accepted by Intl. */
export function isValidTimeZone(timeZone: string): boolean {
  if (timeZone.trim() === '') return false
  try {
    Intl.DateTimeFormat('en-US', { timeZone }).format(new Date())
    return true
  } catch {
    return false
  }
}

function partsInZone(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '0'
  return {
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    second: Number(get('second')),
  }
}

function wallAsUtcMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second = 0,
) {
  return Date.UTC(year, month - 1, day, hour, minute, second)
}

/**
 * Instant when `date` + `time` (HH:mm) is the wall clock in `timeZone`.
 * Throws when the zone or the wall clock is invalid.
 */
export function zonedDateTime(
  date: CalendarDate,
  time: ClockTime,
  timeZone: string,
): Date {
  if (!DATE_RE.test(date)) throw new Error('Tanggal tidak valid.')
  if (!TIME_RE.test(time)) throw new Error('Waktu tidak valid.')
  if (!isValidTimeZone(timeZone)) throw new Error('Zona waktu tidak valid.')

  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const target = wallAsUtcMs(year, month, day, hour, minute)

  let utc = new Date(target)
  for (let i = 0; i < 4; i++) {
    const wall = partsInZone(utc, timeZone)
    const actual = wallAsUtcMs(
      wall.year,
      wall.month,
      wall.day,
      wall.hour,
      wall.minute,
      wall.second,
    )
    const delta = target - actual
    if (delta === 0) break
    utc = new Date(utc.getTime() + delta)
  }
  return utc
}

/** Calendar date `YYYY-MM-DD` for an instant in `timeZone`. */
export function formatZonedDate(
  instant: Date,
  timeZone: string,
): CalendarDate {
  const wall = partsInZone(instant, timeZone)
  return `${String(wall.year).padStart(4, '0')}-${String(wall.month).padStart(2, '0')}-${String(wall.day).padStart(2, '0')}`
}

/** Clock `HH:mm` for an instant in `timeZone`. */
export function formatZonedTime(instant: Date, timeZone: string): ClockTime {
  const wall = partsInZone(instant, timeZone)
  return `${String(wall.hour).padStart(2, '0')}:${String(wall.minute).padStart(2, '0')}`
}

/** Today's calendar date in `timeZone`. */
export function todayInZone(timeZone: string, now = new Date()): CalendarDate {
  return formatZonedDate(now, timeZone)
}

/** Shift a `YYYY-MM-DD` calendar day by `days` (can be negative). */
export function addCalendarDays(date: CalendarDate, days: number): CalendarDate {
  const [year, month, day] = date.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day + days))
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, '0')}-${String(utc.getUTCDate()).padStart(2, '0')}`
}

/** Current `HH:mm` in `timeZone`. */
export function nowTimeInZone(timeZone: string, now = new Date()): ClockTime {
  return formatZonedTime(now, timeZone)
}

/** Browser IANA zone, or `Asia/Jakarta` when Intl has none. */
export function browserTimeZone(): string {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (zone && isValidTimeZone(zone)) return zone
  } catch {
    /* fall through */
  }
  return 'Asia/Jakarta'
}
