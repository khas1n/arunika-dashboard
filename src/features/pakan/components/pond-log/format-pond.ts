const grams = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })
const quantity = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 2,
})
const percent = new Intl.NumberFormat('id-ID', {
  style: 'percent',
  maximumFractionDigits: 2,
})
const calendar = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeZone: 'UTC',
})
const longCalendar = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'long',
  timeZone: 'UTC',
})

export function formatGrams(value: number | null): string {
  if (value == null) return '—'
  return grams.format(value)
}

export function formatQuantity(value: number | null): string {
  if (value == null) return '—'
  return quantity.format(value)
}

export function formatPercent(value: number | null): string {
  if (value == null) return '—'
  return percent.format(value)
}

/** FR min and max as percents. One number when the band is a single rate. */
export function formatFrRange(
  frMin: number | null,
  frMax: number | null,
): string {
  if (frMin == null || frMax == null) return '—'
  if (frMin === frMax) return formatPercent(frMin)
  return `${formatPercent(frMin)} – ${formatPercent(frMax)}`
}

export function formatCalendar(value: string | null): string {
  if (!value) return '—'
  return calendar.format(new Date(`${value}T00:00:00.000Z`))
}

export function formatLongCalendar(value: string): string {
  return longCalendar.format(new Date(`${value}T00:00:00.000Z`))
}

export function formatFcr(value: number | null): string {
  if (value == null) return '—'
  return quantity.format(value)
}
