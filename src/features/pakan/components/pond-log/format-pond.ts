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

export function formatCalendar(value: string | null): string {
  if (!value) return '—'
  return calendar.format(new Date(`${value}T00:00:00.000Z`))
}

export function formatFasting(value: 'pola' | 'dadakan' | null): string {
  if (value === 'pola') return 'Pola'
  if (value === 'dadakan') return 'Dadakan'
  return '—'
}

export function formatFcr(value: number | null): string {
  if (value == null) return '—'
  return quantity.format(value)
}
