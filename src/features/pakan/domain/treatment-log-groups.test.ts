import { describe, expect, it } from 'vitest'
import { groupTreatmentLogs } from '#/features/pakan/domain/treatment-log-groups'
import type { TreatmentLogItem } from '#/features/pakan/schemas/kolam'

function row(
  id: string,
  occurredAt: string,
  name = 'Molase',
): TreatmentLogItem {
  return {
    id,
    treatmentId: 't1',
    treatmentCode: 'MOLASE',
    treatmentName: name,
    quantityGrams: 100,
    occurredAt,
    userName: 'Admin',
  }
}

describe('groupTreatmentLogs', () => {
  it('labels today and yesterday in the viewer zone', () => {
    const now = new Date('2026-10-20T10:00:00.000Z')
    const groups = groupTreatmentLogs(
      [
        row('1', '2026-10-20T05:00:00.000Z'),
        row('2', '2026-10-19T05:00:00.000Z'),
        row('3', '2026-10-18T05:00:00.000Z'),
      ],
      'Asia/Jakarta',
      now,
    )
    expect(groups.map((group) => group.label)).toEqual([
      'Hari ini',
      'Kemarin',
      '18 Oktober 2026',
    ])
    expect(groups[0].items).toHaveLength(1)
  })

  it('keeps same-day rows in one group', () => {
    const groups = groupTreatmentLogs(
      [
        row('1', '2026-10-20T08:00:00.000Z'),
        row('2', '2026-10-20T05:00:00.000Z'),
      ],
      'Asia/Jakarta',
      new Date('2026-10-20T10:00:00.000Z'),
    )
    expect(groups).toHaveLength(1)
    expect(groups[0].items.map((item) => item.id)).toEqual(['1', '2'])
  })
})
