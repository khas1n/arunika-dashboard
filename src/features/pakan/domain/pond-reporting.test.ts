import { describe, expect, it } from 'vitest'
import { cultureDay } from '#/features/pakan/domain/feeding-schedule'
import { feedingRateForWeight } from '#/features/pakan/domain/feeding-rate'
import { summarizePondCycle } from '#/features/pakan/domain/pond-day'
import type { PondDaySource } from '#/features/pakan/domain/pond-day'

const bands = [
  { minWeightGrams: 0, frMin: 0.08, frMax: 0.1 },
  { minWeightGrams: 10, frMin: 0.05, frMax: 0.07 },
  { minWeightGrams: 30, frMin: 0.03, frMax: 0.04 },
]

const schedule = { patterns: [], overrides: [] }

function day(date: string, doc: number, deaths: number): PondDaySource {
  return {
    date,
    doc,
    averageWeightGrams: 10,
    frMin: 0.1,
    frMax: 0.1,
    deaths,
    actualFeedGrams: 0,
  }
}

describe('feedingRateForWeight', () => {
  it('uses the greatest minimum that is still at or below the weight', () => {
    expect(feedingRateForWeight(25, bands)).toEqual({
      frMin: 0.05,
      frMax: 0.07,
    })
    expect(feedingRateForWeight(30, bands)).toEqual({
      frMin: 0.03,
      frMax: 0.04,
    })
    expect(feedingRateForWeight(0, bands)).toBeNull()
    expect(
      feedingRateForWeight(5, [{ minWeightGrams: 10, frMin: 0.1, frMax: 0.2 }]),
    ).toBeNull()
  })
})

describe('cultureDay', () => {
  it('is 1 on the stocking date', () => {
    expect(cultureDay('2026-09-20', '2026-09-20')).toBe(1)
  })

  it('stays on the calendar day when a row is missing', () => {
    expect(cultureDay('2026-09-20', '2026-09-25')).toBe(6)
  })
})

describe('summarizePondCycle', () => {
  it('puts a backfilled day in calendar order and keeps the gap at DOC 6', () => {
    const summary = summarizePondCycle(
      [day('2026-09-25', 2, 1), day('2026-09-21', 9, 4)],
      [{ occurredOn: '2026-09-20', quantity: 100 }],
      schedule,
      '2026-09-20',
    )
    expect(summary.rows.map((row) => row.date)).toEqual([
      '2026-09-21',
      '2026-09-25',
    ])
    expect(summary.rows.map((row) => row.doc)).toEqual([2, 6])
    expect(summary.rows.map((row) => row.population)).toEqual([96, 95])
  })

  it('starts a second cycle at its own stocking date', () => {
    const summary = summarizePondCycle(
      [day('2026-10-01', 40, 0)],
      [{ occurredOn: '2026-10-01', quantity: 50 }],
      schedule,
      '2026-10-01',
    )
    expect(summary.rows[0]?.doc).toBe(1)
    expect(summary.rows[0]?.population).toBe(50)
  })
})
