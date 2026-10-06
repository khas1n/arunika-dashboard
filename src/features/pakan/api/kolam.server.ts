import { prisma } from '#/lib/db.server'
import {
  addDays,
  formatJakartaDate,
  getBibisForDay,
  jakartaDayStart,
  todayInJakarta,
} from '#/features/pakan/domain/feeding-schedule'
import {
  feedConversionRatio,
  projectedCalculatedFeedGrams,
  summarizePondCycle,
} from '#/features/pakan/domain/pond-day'
import type { PondDaySource } from '#/features/pakan/domain/pond-day'
import type {
  FastingOverrideInput,
  KolamLog,
  KolamQuery,
} from '#/features/pakan/schemas/kolam'

const BATCH_NAME = 'BATCH 1'
const POND_ORDER = ['A3', 'B3', 'C3', 'D3', 'A6', 'B6', 'C6', 'D6']

export class KolamError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'KolamError'
  }
}

const NOT_FOUND = 'Kolam tidak ditemukan.'
const OVERRIDE_NOT_FOUND = 'Puasa dadakan tidak ditemukan.'
const ALREADY_ENDED = 'Puasa dadakan ini sudah diakhiri.'

function asNumber(value: { toString: () => string } | null): number | null {
  if (value == null) return null
  return Number(value.toString())
}

function sumOn(
  rows: ReadonlyArray<{ occurredAt: Date; quantity: number }>,
): Map<string, number> {
  const totals = new Map<string, number>()
  for (const row of rows) {
    const date = formatJakartaDate(row.occurredAt)
    totals.set(date, (totals.get(date) ?? 0) + row.quantity)
  }
  return totals
}

const cycleInclude = {
  pond: true,
  feed: true,
  fastingPatterns: true,
  fastingOverrides: { orderBy: { startsAt: 'asc' as const } },
  stockings: {
    include: { seedSource: true },
    orderBy: { occurredOn: 'asc' as const },
  },
  dailyRecords: { orderBy: { doc: 'asc' as const } },
  mortalityEvents: true,
  feedApplications: true,
  bibisRecords: true,
} as const

export async function getKolamLog(query: KolamQuery): Promise<KolamLog> {
  const prepareOn = todayInJakarta()
  const batch = await prisma.batch.findUnique({
    where: { name: BATCH_NAME },
    include: {
      batchPonds: { include: cycleInclude },
    },
  })

  if (!batch) {
    return {
      prepareOn,
      feedingOn: addDays(prepareOn, 2),
      cycles: [],
      selectedId: null,
      days: [],
      bibis: [],
      overrides: [],
    }
  }

  const cycles = [...batch.batchPonds].sort((left, right) => {
    const leftIndex = POND_ORDER.indexOf(left.pond.code)
    const rightIndex = POND_ORDER.indexOf(right.pond.code)
    return (
      (leftIndex === -1 ? 99 : leftIndex) -
      (rightIndex === -1 ? 99 : rightIndex)
    )
  })

  const built = cycles.map((cycle) => {
    const deaths = sumOn(
      cycle.mortalityEvents.map((event) => ({
        occurredAt: event.occurredAt,
        quantity: event.quantity,
      })),
    )
    const actual = sumOn(
      cycle.feedApplications.map((event) => ({
        occurredAt: event.occurredAt,
        quantity: event.quantityGrams,
      })),
    )
    const sources: PondDaySource[] = cycle.dailyRecords.map((record) => {
      const date = record.observedOn
        ? formatJakartaDate(record.observedOn)
        : null
      return {
        date,
        doc: record.doc,
        averageWeightGrams: asNumber(record.averageWeightGrams),
        frMin: asNumber(record.frMin),
        frMax: asNumber(record.frMax),
        deaths: date == null ? 0 : (deaths.get(date) ?? 0),
        actualFeedGrams: date == null ? 0 : (actual.get(date) ?? 0),
      }
    })
    const stockings = cycle.stockings.map((stocking) => ({
      occurredOn: formatJakartaDate(stocking.occurredOn),
      quantity: stocking.quantity,
    }))
    const schedule = {
      patterns: cycle.fastingPatterns.map((pattern) => ({
        feedDayCount: pattern.feedDayCount,
        fastDayCount: pattern.fastDayCount,
        anchorOn: formatJakartaDate(pattern.anchorOn),
        effectiveFrom: formatJakartaDate(pattern.effectiveFrom),
      })),
      overrides: cycle.fastingOverrides.map((override) => ({
        startsAt: override.startsAt,
        endsAt: override.endsAt,
        reason: override.reason,
        revokedAt: override.revokedAt,
      })),
    }
    const summary = summarizePondCycle(sources, stockings, schedule)
    const totalActual = cycle.feedApplications.reduce(
      (sum, event) => sum + event.quantityGrams,
      0,
    )
    const pattern = [...cycle.fastingPatterns]
      .sort((left, right) =>
        formatJakartaDate(left.effectiveFrom) <
        formatJakartaDate(right.effectiveFrom)
          ? 1
          : -1,
      )
      .at(0)
    const seedNames = [
      ...new Set(cycle.stockings.map((stocking) => stocking.seedSource.name)),
    ]
    const prepared = new Map<string, number>()
    for (const record of cycle.bibisRecords) {
      const date = formatJakartaDate(record.feedingOn)
      prepared.set(date, (prepared.get(date) ?? 0) + record.quantityGrams)
    }

    return {
      id: cycle.id,
      pondCode: cycle.pond.code,
      pondName: cycle.pond.name,
      seedSource: seedNames.length > 0 ? seedNames.join(', ') : null,
      seedCount: cycle.stockings.reduce(
        (sum, stocking) => sum + stocking.quantity,
        0,
      ),
      volumeM3: asNumber(cycle.volumeM3),
      puasa: pattern ? `${pattern.feedDayCount}:${pattern.fastDayCount}` : null,
      feedName: cycle.feed?.name ?? null,
      fcr: feedConversionRatio(
        totalActual,
        summary.initialBiomassGrams,
        summary.latestBiomassGrams,
      ),
      days: summary.rows,
      sources,
      stockings,
      schedule,
      prepared,
      overrides: cycle.fastingOverrides
        .filter((override) => override.revokedAt == null)
        .map((override) => ({
          id: override.id,
          startsOn: formatJakartaDate(override.startsAt),
          endsOn: addDays(formatJakartaDate(override.endsAt), -1),
          reason: override.reason,
          note: override.note,
        })),
    }
  })

  const selected =
    built.find((cycle) => cycle.id === query.batchPondId) ?? built.at(0) ?? null
  const bibis = getBibisForDay(
    prepareOn,
    built.map((cycle) => ({
      batchPondId: cycle.id,
      schedule: cycle.schedule,
      getCalculatedFeedGrams: (feedingOn: string) =>
        projectedCalculatedFeedGrams(feedingOn, cycle.sources, cycle.stockings),
      getPreparedGrams: (feedingOn: string) =>
        cycle.prepared.get(feedingOn) ?? 0,
    })),
    batch.bibisLeadDays,
  )
  const pondCode = new Map(built.map((cycle) => [cycle.id, cycle.pondCode]))

  return {
    prepareOn,
    feedingOn: bibis.feedingOn,
    cycles: built.map((cycle) => ({
      id: cycle.id,
      pondCode: cycle.pondCode,
      pondName: cycle.pondName,
      seedSource: cycle.seedSource,
      seedCount: cycle.seedCount,
      volumeM3: cycle.volumeM3,
      puasa: cycle.puasa,
      feedName: cycle.feedName,
      fcr: cycle.fcr,
    })),
    selectedId: selected?.id ?? null,
    days: selected?.days ?? [],
    bibis: bibis.items.map((item) => ({
      batchPondId: item.batchPondId,
      pondCode: pondCode.get(item.batchPondId) ?? item.batchPondId,
      feedingOn: item.feedingOn,
      requiredGrams: item.requiredGrams,
      remainingGrams: item.remainingGrams,
      fastingReason:
        item.fastingReason === 'OVERRIDE'
          ? 'dadakan'
          : item.fastingReason === 'RECURRING'
            ? 'pola'
            : null,
    })),
    overrides: selected?.overrides ?? [],
  }
}

export async function createFastingOverride(
  input: FastingOverrideInput,
  userId: string,
) {
  const cycle = await prisma.batchPond.findUnique({
    where: { id: input.batchPondId },
    select: { id: true },
  })
  if (!cycle) throw new KolamError(NOT_FOUND)

  await prisma.fastingOverride.create({
    data: {
      batchPondId: input.batchPondId,
      startsAt: jakartaDayStart(input.startsOn),
      endsAt: jakartaDayStart(addDays(input.endsOn, 1)),
      reason: input.reason,
      note: input.note === '' ? null : input.note,
      userId,
    },
  })
}

export async function revokeFastingOverride(id: string, userId: string) {
  const override = await prisma.fastingOverride.findUnique({ where: { id } })
  if (!override) throw new KolamError(OVERRIDE_NOT_FOUND)
  if (override.revokedAt) throw new KolamError(ALREADY_ENDED)

  await prisma.fastingOverride.update({
    where: { id },
    data: { revokedAt: new Date(), revokedById: userId },
  })
}
