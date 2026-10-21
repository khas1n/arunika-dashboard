import { describe, expect, it } from 'vitest'
import {
  treatmentLogInputSchema,
  treatmentLogUpdateSchema,
} from '#/features/pakan/schemas/kolam'

const valid = {
  batchPondId: 'bp1',
  treatmentId: 't1',
  quantityGrams: 10,
  date: '2026-10-02',
  time: '12:00',
  timeZone: 'Asia/Jakarta',
}

describe('treatmentLogInputSchema', () => {
  it('accepts a valid wall clock payload', () => {
    expect(treatmentLogInputSchema.parse(valid)).toEqual(valid)
  })

  it('rejects quantity below one gram', () => {
    const result = treatmentLogInputSchema.safeParse({
      ...valid,
      quantityGrams: 0,
    })
    expect(result.success).toBe(false)
  })

  it('uses Indonesian messages for empty treatment and amount', () => {
    const result = treatmentLogInputSchema.safeParse({
      ...valid,
      treatmentId: '',
      quantityGrams: null,
    })
    expect(result.success).toBe(false)
    if (result.success) return
    const messages = result.error.issues.map((issue) => issue.message)
    expect(messages).toContain('Pilih treatment')
    expect(messages).toContain('Jumlah wajib diisi')
  })

  it('rejects an invalid clock', () => {
    const result = treatmentLogInputSchema.safeParse({
      ...valid,
      time: '25:00',
    })
    expect(result.success).toBe(false)
  })

  it('rejects an unknown time zone', () => {
    const result = treatmentLogInputSchema.safeParse({
      ...valid,
      timeZone: 'Not/AZone',
    })
    expect(result.success).toBe(false)
  })
})

describe('treatmentLogUpdateSchema', () => {
  it('requires an id and omits batchPondId', () => {
    const parsed = treatmentLogUpdateSchema.parse({
      id: 'log1',
      treatmentId: valid.treatmentId,
      quantityGrams: valid.quantityGrams,
      date: valid.date,
      time: valid.time,
      timeZone: valid.timeZone,
    })
    expect(parsed.id).toBe('log1')
    expect('batchPondId' in parsed).toBe(false)
  })
})
