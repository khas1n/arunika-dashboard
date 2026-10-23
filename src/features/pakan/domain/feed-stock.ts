/**
 * Pellet stock and the bibis forecast for one feed brand.
 *
 * Stock falls only by grams actually given to a pond. The recommended
 * amount, the feeding rate, and bibis that was prepared do not change it.
 * The forecast is compared with stock. It is not a stock movement.
 */

import type { CalendarDate } from '#/features/pakan/domain/feeding-schedule'

export interface FeedStockGrams {
  receivedGrams: number
  /** Actual grams recorded on ponds for this feed. Not the recommendation. */
  consumedGrams: number
  adjustmentGrams: number
}

/** Receipts minus actual pond grams, plus opname adjustments. */
export function feedStockGrams(input: FeedStockGrams): number {
  return input.receivedGrams - input.consumedGrams + input.adjustmentGrams
}

export type BibisStockStatus = 'aman' | 'perlu-tambah' | 'data-belum-lengkap'

export interface FeedStockInput extends FeedStockGrams {
  feedId: string
  feedName: string
}

export interface PondBibisNeed {
  batchPondId: string
  pondCode: string
  feedId: string | null
  feedingOn: CalendarDate
  /** Null when the pond is feeding and the amount cannot be calculated. */
  requiredGrams: number | null
  fasting: boolean
}

export interface PreparedBibis {
  feedId: string
  feedingOn: CalendarDate
  quantityGrams: number
}

export interface BibisPondLine {
  batchPondId: string
  pondCode: string
  requiredGrams: number | null
  fasting: boolean
  incomplete: boolean
}

export interface BibisFeedProjection {
  feedId: string
  feedName: string
  /** Null when no active pond uses this feed, so there is no target day. */
  feedingOn: CalendarDate | null
  stockGrams: number
  consumedGrams: number
  requiredGrams: number | null
  preparedGrams: number
  remainingGrams: number | null
  shortageGrams: number | null
  stillToPrepareGrams: number | null
  status: BibisStockStatus
  missingPondCodes: string[]
  ponds: BibisPondLine[]
}

export interface FeedBibisProjection {
  rows: BibisFeedProjection[]
  /** Active ponds with no feed brand. Their need is not added to any row. */
  unassignedPonds: BibisPondLine[]
}

function pondLine(pond: PondBibisNeed): BibisPondLine {
  const incomplete = !pond.fasting && pond.requiredGrams === null
  return {
    batchPondId: pond.batchPondId,
    pondCode: pond.pondCode,
    requiredGrams: pond.requiredGrams,
    fasting: pond.fasting,
    incomplete,
  }
}

function projectGroup(
  feed: FeedStockInput,
  feedingOn: CalendarDate | null,
  ponds: readonly PondBibisNeed[],
  preparedGrams: number,
): BibisFeedProjection {
  const lines = ponds.map(pondLine)
  const missingPondCodes = lines
    .filter((line) => line.incomplete)
    .map((line) => line.pondCode)
  const stockGrams = feedStockGrams(feed)
  const requiredGrams = lines.reduce(
    (sum, line) => sum + (line.requiredGrams ?? 0),
    0,
  )

  return {
    feedId: feed.feedId,
    feedName: feed.feedName,
    feedingOn,
    stockGrams,
    consumedGrams: feed.consumedGrams,
    requiredGrams,
    preparedGrams,
    remainingGrams: stockGrams - requiredGrams,
    shortageGrams: Math.max(0, requiredGrams - stockGrams),
    stillToPrepareGrams: Math.max(0, requiredGrams - preparedGrams),
    status: stockGrams >= requiredGrams ? 'aman' : 'perlu-tambah',
    missingPondCodes,
    ponds: lines,
  }
}

/**
 * One row per feed and target feeding day.
 * Ponds on different brands, or the same brand with different feeding days,
 * are not added together. Prepared grams are matched to that feed and day.
 */
export function projectFeedBibis(input: {
  feeds: readonly FeedStockInput[]
  prepared: readonly PreparedBibis[]
  ponds: readonly PondBibisNeed[]
}): FeedBibisProjection {
  const feeds = [...input.feeds].sort((left, right) =>
    left.feedName.localeCompare(right.feedName, 'id'),
  )
  const known = new Set(feeds.map((feed) => feed.feedId))
  const groups = new Map<string, PondBibisNeed[]>()
  const unassignedPonds: BibisPondLine[] = []

  for (const pond of input.ponds) {
    if (pond.feedId == null || !known.has(pond.feedId)) {
      unassignedPonds.push(pondLine(pond))
      continue
    }
    const key = `${pond.feedId}\0${pond.feedingOn}`
    const group = groups.get(key) ?? []
    group.push(pond)
    groups.set(key, group)
  }

  const rows: BibisFeedProjection[] = []
  for (const feed of feeds) {
    const keys = [...groups.keys()]
      .filter((key) => key.startsWith(`${feed.feedId}\0`))
      .sort()
    if (keys.length === 0) {
      rows.push(projectGroup(feed, null, [], 0))
      continue
    }
    for (const key of keys) {
      const feedingOn = key.slice(feed.feedId.length + 1)
      const preparedGrams = input.prepared
        .filter(
          (row) => row.feedId === feed.feedId && row.feedingOn === feedingOn,
        )
        .reduce((sum, row) => sum + row.quantityGrams, 0)
      rows.push(
        projectGroup(feed, feedingOn, groups.get(key) ?? [], preparedGrams),
      )
    }
  }

  unassignedPonds.sort((left, right) =>
    left.pondCode.localeCompare(right.pondCode, 'id'),
  )

  return { rows, unassignedPonds }
}
