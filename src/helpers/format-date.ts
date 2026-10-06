const mediumDate = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeZone: 'Asia/Jakarta',
})

export function formatDate(value: Date) {
  return mediumDate.format(value)
}
