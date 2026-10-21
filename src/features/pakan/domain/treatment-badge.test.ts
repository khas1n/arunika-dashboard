import { describe, expect, it } from 'vitest'
import { treatmentBadgeVariant } from '#/features/pakan/domain/treatment-badge'

describe('treatmentBadgeVariant', () => {
  it('maps known treatments by name', () => {
    expect(treatmentBadgeVariant({ name: 'Molase' })).toBe('warning')
    expect(treatmentBadgeVariant({ name: 'Gos Strong' })).toBe('info')
    expect(treatmentBadgeVariant({ name: 'Aqua Cell' })).toBe('success')
    expect(treatmentBadgeVariant({ name: 'Basilus' })).toBe('accent')
  })

  it('maps known treatments by code', () => {
    expect(treatmentBadgeVariant({ code: 'MOLASE' })).toBe('warning')
    expect(treatmentBadgeVariant({ code: 'basilus' })).toBe('accent')
  })

  it('is stable for the same unknown key', () => {
    const left = treatmentBadgeVariant({ name: 'Probiotik X' })
    const right = treatmentBadgeVariant({ name: 'Probiotik X' })
    expect(left).toBe(right)
  })
})
