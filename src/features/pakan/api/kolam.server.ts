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
  BibisLine,
  BibisQuery,
  DadakanQuery,
  FastingOverrideInput,
  FastingOverrideItem,
  PondDayWrite,
  BiomassSeries,
  KolamCycle,
  KolamPondLink,
  PondDay,
  PondDayQuery,
  PondHeaderQuery,
  PondListQuery,
} from '#/features/pakan/schemas/kolam'
import { slicePage } from '#/lib/page'

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
const DATE_TAKEN = 'Tanggal ini sudah punya catatan.'
const DAY_MISSING = 'Catatan harian untuk tanggal ini tidak ada.'
const NO_FEED = 'Kolam ini belum punya pakan.'
const DAY_CONFLICT = 'Catatan harian bentrok. Coba lagi.'

function decimal(value: number | null, digits: number) {
  if (value == null) return null
  return value.toFixed(digits)
}

function prismaErrorCode(error: unknown) {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    return error.code
  }
  return undefined
}

function asNumber(value: { toString: () => string } | null): number | null {
  if (value == null) return null
  return Number(value.toString())
}

function sortPonds<T extends { pond: { code: string } }>(ponds: Array<T>) {
  return [...ponds].sort((left, right) => {
    const leftIndex = POND_ORDER.indexOf(left.pond.code)
    const rightIndex = POND_ORDER.indexOf(right.pond.code)
    return (
      (leftIndex === -1 ? 99 : leftIndex) -
      (rightIndex === -1 ? 99 : rightIndex)
    )
  })
}

export async function listKolamPonds(
  query: PondListQuery,
): Promise<{ rows: Array<KolamPondLink>; rowCount: number }> {
  const loaded = await loadBuilt()
  const ponds = loaded.cycles.map((cycle) => ({
    code: cycle.pondCode,
    name: cycle.pondName,
  }))
  const ordered = query.sortDesc ? [...ponds].reverse() : ponds
  return slicePage(ordered, query)
}

export async function getKolamHeader(
  query: PondHeaderQuery,
): Promise<{ rows: Array<KolamCycle>; rowCount: number }> {
  const selected = (await loadBuilt()).cycles.find(
    (cycle) => cycle.pondCode === query.pondCode,
  )
  if (!selected) return { rows: [], rowCount: 0 }
  return slicePage([toCycle(selected)], query)
}

export async function listKolamBibis(
  query: BibisQuery,
): Promise<{ rows: Array<BibisLine>; rowCount: number }> {
  const loaded = await loadBuilt()
  const line = loaded.bibis.find((item) => item.pondCode === query.pondCode)
  return slicePage(line ? [line] : [], query)
}

export async function listKolamDays(
  query: PondDayQuery,
): Promise<{ rows: Array<PondDay>; rowCount: number }> {
  const selected = (await loadBuilt()).cycles.find(
    (cycle) => cycle.pondCode === query.pondCode,
  )
  const days = [...(selected?.days ?? [])].sort((left, right) =>
    compareDays(left, right, query),
  )
  return slicePage(days, query)
}

export async function listKolamBiomass(
  pondCode: string,
): Promise<BiomassSeries> {
  const selected = (await loadBuilt()).cycles.find(
    (cycle) => cycle.pondCode === pondCode,
  )
  const points = (selected?.days ?? []).flatMap((day) => {
    if (day.date == null || day.biomassGrams == null) return []
    return [{ date: day.date, biomassGrams: day.biomassGrams }]
  })
  points.sort((left, right) =>
    left.date < right.date ? -1 : left.date > right.date ? 1 : 0,
  )
  return { pondCode, points }
}

export async function listKolamOverrides(
  query: DadakanQuery,
): Promise<{ rows: Array<FastingOverrideItem>; rowCount: number }> {
  const selected = (await loadBuilt()).cycles.find(
    (cycle) => cycle.pondCode === query.pondCode,
  )
  const overrides = [...(selected?.overrides ?? [])].sort((left, right) =>
    compareOverrides(left, right, query),
  )
  return slicePage(overrides, query)
}

function toCycle(cycle: BuiltCycle): KolamCycle {
  return {
    id: cycle.id,
    pondCode: cycle.pondCode,
    pondName: cycle.pondName,
    seedSource: cycle.seedSource,
    seedCount: cycle.seedCount,
    volumeM3: cycle.volumeM3,
    puasa: cycle.puasa,
    feedName: cycle.feedName,
    fcr: cycle.fcr,
  }
}

function compareNullable(
  left: string | number | null,
  right: string | number | null,
  desc: boolean,
) {
  if (left == null && right == null) return 0
  if (left == null) return 1
  if (right == null) return -1
  const order = left < right ? -1 : left > right ? 1 : 0
  return desc ? -order : order
}

function compareDays(left: PondDay, right: PondDay, query: PondDayQuery) {
  const key = query.sortId
  return compareNullable(left[key], right[key], query.sortDesc)
}

function compareOverrides(
  left: FastingOverrideItem,
  right: FastingOverrideItem,
  query: DadakanQuery,
) {
  if (query.sortId === 'status') {
    const group = Number(left.ended) - Number(right.ended)
    if (group !== 0) return query.sortDesc ? -group : group
    return compareNullable(left.startsOn, right.startsOn, false)
  }
  if (query.sortId === 'reason') {
    return compareNullable(left.reason, right.reason, query.sortDesc)
  }
  return compareNullable(left.startsOn, right.startsOn, query.sortDesc)
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

async function loadBuilt() {
  const prepareOn = todayInJakarta()
  const batch = await prisma.batch.findUnique({
    where: { name: BATCH_NAME },
    include: {
      batchPonds: { include: cycleInclude },
    },
  })

  if (!batch) return { cycles: [], bibis: [] as Array<BibisLine> }

  const cycles = sortPonds(batch.batchPonds)

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
      overrides: cycle.fastingOverrides.map((override) => ({
        id: override.id,
        startsOn: formatJakartaDate(override.startsAt),
        endsOn: addDays(formatJakartaDate(override.endsAt), -1),
        reason: override.reason,
        note: override.note,
        ended: override.revokedAt != null,
      })),
    }
  })

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
    cycles: built,
    bibis: bibis.items.map((item) => ({
      batchPondId: item.batchPondId,
      pondCode: pondCode.get(item.batchPondId) ?? item.batchPondId,
      prepareOn,
      feedingOn: item.feedingOn,
      requiredGrams: item.requiredGrams,
      remainingGrams: item.remainingGrams,
      fastingReason:
        item.fastingReason === 'OVERRIDE'
          ? ('dadakan' as const)
          : item.fastingReason === 'RECURRING'
            ? ('pola' as const)
            : null,
    })),
  }
}

type BuiltCycle = Awaited<ReturnType<typeof loadBuilt>>['cycles'][number]

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

/**
 * Writes the day's inputs. Deaths and actual feed replace that date's total
 * instead of appending another event. Derived columns are not stored.
 */
export async function upsertPondDay(input: PondDayWrite, userId: string) {
  const observedOn = new Date(`${input.date}T00:00:00.000Z`)
  const dayStart = jakartaDayStart(input.date)
  const dayEnd = jakartaDayStart(addDays(input.date, 1))

  try {
    await prisma.$transaction(async (tx) => {
      const cycle = await tx.batchPond.findUnique({
        where: { id: input.batchPondId },
        select: { id: true, feedId: true },
      })
      if (!cycle) throw new KolamError(NOT_FOUND)

      const feedId = cycle.feedId
      if (input.actualFeedGrams > 0 && feedId == null) {
        throw new KolamError(NO_FEED)
      }

      const records = await tx.pondDailyRecord.findMany({
        where: { batchPondId: cycle.id },
        select: { id: true, doc: true, observedOn: true },
      })
      const existing = records.find(
        (record) =>
          record.observedOn != null &&
          formatJakartaDate(record.observedOn) === input.date,
      )
      if (input.create && existing) throw new KolamError(DATE_TAKEN)
      if (!input.create && !existing) throw new KolamError(DAY_MISSING)

      const snapshot = {
        averageWeightGrams: decimal(input.averageWeightGrams, 3),
        frMin: decimal(input.frMin, 4),
        frMax: decimal(input.frMax, 4),
      }
      if (existing) {
        await tx.pondDailyRecord.update({
          where: { id: existing.id },
          data: snapshot,
        })
      } else {
        const doc =
          records.reduce((max, record) => Math.max(max, record.doc), 0) + 1
        await tx.pondDailyRecord.create({
          data: {
            batchPondId: cycle.id,
            doc,
            observedOn,
            ...snapshot,
          },
        })
      }

      await tx.mortalityEvent.deleteMany({
        where: {
          batchPondId: cycle.id,
          occurredAt: { gte: dayStart, lt: dayEnd },
        },
      })
      if (input.deaths > 0) {
        await tx.mortalityEvent.create({
          data: {
            batchPondId: cycle.id,
            quantity: input.deaths,
            occurredAt: dayStart,
            userId,
          },
        })
      }

      await tx.feedApplication.deleteMany({
        where: {
          batchPondId: cycle.id,
          occurredAt: { gte: dayStart, lt: dayEnd },
        },
      })
      if (input.actualFeedGrams > 0 && feedId != null) {
        await tx.feedApplication.create({
          data: {
            batchPondId: cycle.id,
            feedId,
            quantityGrams: input.actualFeedGrams,
            occurredAt: dayStart,
            userId,
          },
        })
      }
    })
  } catch (error) {
    if (error instanceof KolamError) throw error
    if (prismaErrorCode(error) === 'P2002') throw new KolamError(DAY_CONFLICT)
    throw error
  }
}
