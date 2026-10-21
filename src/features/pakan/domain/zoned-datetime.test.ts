import { describe, expect, it } from 'vitest'
import {
  formatZonedDate,
  formatZonedTime,
  isValidTimeZone,
  zonedDateTime,
} from '#/features/pakan/domain/zoned-datetime'

describe('zonedDateTime', () => {
  it('maps Jakarta wall noon to the UTC instant seven hours earlier', () => {
    const instant = zonedDateTime('2026-10-02', '12:00', 'Asia/Jakarta')
    expect(instant.toISOString()).toBe('2026-10-02T05:00:00.000Z')
  })

  it('round-trips wall clock in Asia/Jakarta', () => {
    const instant = zonedDateTime('2026-10-02', '14:30', 'Asia/Jakarta')
    expect(formatZonedDate(instant, 'Asia/Jakarta')).toBe('2026-10-02')
    expect(formatZonedTime(instant, 'Asia/Jakarta')).toBe('14:30')
  })

  it('rejects a bad time zone', () => {
    expect(isValidTimeZone('Not/AZone')).toBe(false)
    expect(() => zonedDateTime('2026-10-02', '12:00', 'Not/AZone')).toThrow(
      /Zona waktu/,
    )
  })

  it('rejects a bad clock', () => {
    expect(() => zonedDateTime('2026-10-02', '25:00', 'Asia/Jakarta')).toThrow(
      /Waktu/,
    )
  })
})
