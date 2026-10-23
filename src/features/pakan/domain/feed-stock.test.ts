import { describe, expect, it } from 'vitest'
import {
  addDays,
  getBibisForDay,
} from '#/features/pakan/domain/feeding-schedule'
import {
  feedStockGrams,
  projectFeedBibis,
} from '#/features/pakan/domain/feed-stock'
import type { PondBibisNeed } from '#/features/pakan/domain/feed-stock'

const emptySchedule = { patterns: [], overrides: [] }

function need(
  overrides: Partial<PondBibisNeed> &
    Pick<PondBibisNeed, 'pondCode' | 'feedId'>,
): PondBibisNeed {
  return {
    batchPondId: overrides.pondCode,
    feedingOn: '2026-10-24',
    requiredGrams: 100,
    fasting: false,
    ...overrides,
  }
}

describe('feedStockGrams', () => {
  it('subtracts actual pond grams and ignores a larger recommendation', () => {
    const receivedGrams = 1000
    const recommendationGrams = 150
    const actualGrams = 100
    const before = feedStockGrams({
      receivedGrams,
      consumedGrams: 0,
      adjustmentGrams: 0,
    })
    const after = feedStockGrams({
      receivedGrams,
      consumedGrams: actualGrams,
      adjustmentGrams: 0,
    })

    expect(recommendationGrams).toBe(150)
    expect(after).toBe(before - actualGrams)
    expect(after).toBe(900)
  })

  it('adds an opname adjustment after actual consumption', () => {
    expect(
      feedStockGrams({
        receivedGrams: 100_000,
        consumedGrams: 20_000,
        adjustmentGrams: -5_000,
      }),
    ).toBe(75_000)
  })
})

describe('getBibisForDay', () => {
  const prepareOn = '2026-10-22'

  it('keeps a feeding pond with no calculated amount incomplete', () => {
    const result = getBibisForDay(
      prepareOn,
      [
        {
          batchPondId: 'a3',
          schedule: emptySchedule,
          getCalculatedFeedGrams: () => null,
          getPreparedGrams: () => 0,
        },
      ],
      2,
    )

    expect(result.feedingOn).toBe(addDays(prepareOn, 2))
    expect(result.items[0]?.requiredGrams).toBeNull()
    expect(result.items[0]?.remainingGrams).toBeNull()
    expect(result.incomplete).toBe(true)
    expect(result.totalRequiredGrams).toBeNull()
    expect(result.totalRemainingGrams).toBeNull()
  })

  it('uses 0 when the feeding day is fasting, even without a calculated amount', () => {
    const feedingOn = addDays(prepareOn, 2)
    const result = getBibisForDay(
      prepareOn,
      [
        {
          batchPondId: 'a3',
          schedule: {
            patterns: [],
            overrides: [
              {
                startsAt: new Date(`${feedingOn}T00:00:00.000Z`),
                endsAt: new Date('2026-10-25T00:00:00.000Z'),
                reason: 'air',
              },
            ],
          },
          getCalculatedFeedGrams: () => null,
          getPreparedGrams: () => 40,
        },
      ],
      2,
    )

    expect(result.items[0]?.requiredGrams).toBe(0)
    expect(result.items[0]?.incomplete).toBe(false)
    expect(result.items[0]?.preparedButNotNeeded).toBe(true)
    expect(result.totalRequiredGrams).toBe(0)
  })

  it('does not add an incomplete pond into the total as zero', () => {
    const result = getBibisForDay(
      prepareOn,
      [
        {
          batchPondId: 'a3',
          schedule: emptySchedule,
          getCalculatedFeedGrams: () => 100.2,
          getPreparedGrams: () => 0,
        },
        {
          batchPondId: 'a4',
          schedule: emptySchedule,
          getCalculatedFeedGrams: () => null,
          getPreparedGrams: () => 0,
        },
      ],
      2,
    )

    expect(result.items[0]?.requiredGrams).toBe(100)
    expect(result.totalRequiredGrams).toBeNull()
    expect(result.incomplete).toBe(true)
  })
})

describe('projectFeedBibis', () => {
  const feeds = [
    {
      feedId: 'safir',
      feedName: 'Safir',
      receivedGrams: 500,
      consumedGrams: 0,
      adjustmentGrams: 0,
    },
    {
      feedId: 'pellet',
      feedName: '781',
      receivedGrams: 1000,
      consumedGrams: 100,
      adjustmentGrams: 0,
    },
  ]

  it('compares stock that already excludes actual grams with the forecast', () => {
    const projection = projectFeedBibis({
      feeds,
      prepared: [
        { feedId: 'pellet', feedingOn: '2026-10-24', quantityGrams: 40 },
      ],
      ponds: [
        need({ pondCode: 'A3', feedId: 'pellet', requiredGrams: 150 }),
        need({ pondCode: 'A4', feedId: 'safir', requiredGrams: 80 }),
      ],
    })
    const pellet = projection.rows.find((row) => row.feedId === 'pellet')
    const safir = projection.rows.find((row) => row.feedId === 'safir')

    expect(pellet).toMatchObject({
      stockGrams: 900,
      consumedGrams: 100,
      requiredGrams: 150,
      preparedGrams: 40,
      remainingGrams: 750,
      shortageGrams: 0,
      stillToPrepareGrams: 110,
      status: 'aman',
    })
    expect(safir?.requiredGrams).toBe(80)
    expect(safir?.stockGrams).toBe(500)
  })

  it('marks a shortage only from stock and the forecast', () => {
    const projection = projectFeedBibis({
      feeds: [
        {
          feedId: 'pellet',
          feedName: '781',
          receivedGrams: 100,
          consumedGrams: 0,
          adjustmentGrams: 0,
        },
      ],
      prepared: [],
      ponds: [need({ pondCode: 'A3', feedId: 'pellet', requiredGrams: 150 })],
    })

    expect(projection.rows[0]).toMatchObject({
      status: 'perlu-tambah',
      remainingGrams: -50,
      shortageGrams: 50,
    })
  })

  it('leaves a pond with no calculated amount out of the bibis total', () => {
    const projection = projectFeedBibis({
      feeds: [
        {
          feedId: 'pellet',
          feedName: '781',
          receivedGrams: 1000,
          consumedGrams: 0,
          adjustmentGrams: 0,
        },
      ],
      prepared: [],
      ponds: [
        need({ pondCode: 'A3', feedId: 'pellet', requiredGrams: 150 }),
        need({ pondCode: 'A4', feedId: 'pellet', requiredGrams: null }),
      ],
    })

    expect(projection.rows[0]).toMatchObject({
      status: 'aman',
      requiredGrams: 150,
      remainingGrams: 850,
      shortageGrams: 0,
      missingPondCodes: ['A4'],
    })
  })

  it('keeps a fasting pond at zero and a feed with no ponds complete', () => {
    const projection = projectFeedBibis({
      feeds: [
        {
          feedId: 'pellet',
          feedName: '781',
          receivedGrams: 10,
          consumedGrams: 0,
          adjustmentGrams: 0,
        },
      ],
      prepared: [],
      ponds: [
        need({
          pondCode: 'A3',
          feedId: 'pellet',
          requiredGrams: 0,
          fasting: true,
        }),
      ],
    })

    expect(projection.rows[0]).toMatchObject({
      requiredGrams: 0,
      status: 'aman',
      shortageGrams: 0,
    })
  })

  it('does not merge two feeding days or two brands', () => {
    const projection = projectFeedBibis({
      feeds,
      prepared: [],
      ponds: [
        need({
          pondCode: 'A3',
          feedId: 'pellet',
          feedingOn: '2026-10-24',
          requiredGrams: 10,
        }),
        need({
          pondCode: 'B1',
          feedId: 'pellet',
          feedingOn: '2026-10-25',
          requiredGrams: 20,
        }),
      ],
    })
    const pelletRows = projection.rows.filter((row) => row.feedId === 'pellet')

    expect(pelletRows.map((row) => row.feedingOn)).toEqual([
      '2026-10-24',
      '2026-10-25',
    ])
    expect(pelletRows.map((row) => row.requiredGrams)).toEqual([10, 20])
  })

  it('leaves a pond with no brand out of every total', () => {
    const projection = projectFeedBibis({
      feeds: [
        {
          feedId: 'pellet',
          feedName: '781',
          receivedGrams: 0,
          consumedGrams: 0,
          adjustmentGrams: 0,
        },
      ],
      prepared: [],
      ponds: [
        need({ pondCode: 'A3', feedId: null, requiredGrams: 40 }),
        need({ pondCode: 'A4', feedId: 'pellet', requiredGrams: 10 }),
      ],
    })

    expect(projection.unassignedPonds.map((pond) => pond.pondCode)).toEqual([
      'A3',
    ])
    expect(projection.rows[0]?.requiredGrams).toBe(10)
  })

  it('does not let prepared grams change stock', () => {
    const projection = projectFeedBibis({
      feeds: [
        {
          feedId: 'pellet',
          feedName: '781',
          receivedGrams: 200,
          consumedGrams: 0,
          adjustmentGrams: 0,
        },
      ],
      prepared: [
        { feedId: 'pellet', feedingOn: '2026-10-24', quantityGrams: 200 },
      ],
      ponds: [need({ pondCode: 'A3', feedId: 'pellet', requiredGrams: 50 })],
    })

    expect(projection.rows[0]?.stockGrams).toBe(200)
    expect(projection.rows[0]?.preparedGrams).toBe(200)
    expect(projection.rows[0]?.stillToPrepareGrams).toBe(0)
  })
})
