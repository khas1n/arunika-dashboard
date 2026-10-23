const mediumDate = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeZone: 'Asia/Jakarta',
})

const dateTime = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
})

export function formatDate(value: Date) {
  return mediumDate.format(value)
}

export function formatDateTime(value: Date) {
  return dateTime.format(value)
}
