import { prisma } from '#/lib/db.server'
import {
  addDays,
  formatJakartaDate,
  getBibisForDay,
  jakartaDayStart,
  todayInJakarta,
} from '#/features/pakan/domain/feeding-schedule'
import { feedingRateForWeight } from '#/features/pakan/domain/feeding-rate'
import {
  feedConversionRatio,
  projectedCalculatedFeedGrams,
  summarizePondCycle,
} from '#/features/pakan/domain/pond-day'
import type { PondDaySource } from '#/features/pakan/domain/pond-day'
import {
  zonedDateTime,
} from '#/features/pakan/domain/zoned-datetime'
import type {
  BibisLine,
  BibisQuery,
  DadakanQuery,
  FastingOverrideInput,
  FastingOverrideItem,
  PondDayLookup,
  PondDayPatch,
  KolamChart,
  KolamChartQuery,
  KolamCycle,
  KolamPondLink,
  PondDay,
  PondDayQuery,
  PondHeaderQuery,
  PondListQuery,
  TreatmentLogInput,
  TreatmentLogItem,
  TreatmentLogQuery,
  TreatmentLogUpdate,
  TreatmentOption,
  TreatmentPlan,
  TreatmentPlanQuery,
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
const NO_FEED = 'Kolam ini belum punya pakan.'
const DAY_CONFLICT = 'Catatan harian bentrok. Coba lagi.'
const NOT_STOCKED = 'Kolam ini belum ditebar.'
const BEFORE_STOCKING = 'Tanggal ini sebelum tebar bibit.'
const TREATMENT_NOT_FOUND = 'Treatment tidak ditemukan.'
const LOG_NOT_FOUND = 'Catatan treatment tidak ditemukan.'
const LOG_REVOKED = 'Catatan treatment ini sudah dihapus.'
const BAD_WALL_CLOCK = 'Tanggal atau waktu tidak valid.'

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

const chartInclude = {
  dailyRecords: { orderBy: { doc: 'asc' as const } },
  mortalityEvents: { select: { occurredAt: true, quantity: true } },
  feedApplications: { select: { occurredAt: true, quantityGrams: true } },
  stockings: {
    select: { occurredOn: true, quantity: true },
    orderBy: { occurredOn: 'asc' as const },
  },
  fastingPatterns: true,
  fastingOverrides: { orderBy: { startsAt: 'asc' as const } },
} as const

export async function listKolamChart(
  query: KolamChartQuery,
): Promise<KolamChart> {
  const cycle = await prisma.batchPond.findFirst({
    where: { pond: { code: query.pondCode }, batch: { name: BATCH_NAME } },
    include: chartInclude,
  })
  if (!cycle) return { pondCode: query.pondCode, points: [] }
  const points = cycleSummary(cycle).summary.rows.flatMap((day) => {
    if (day.date == null) return []
    if (query.from != null && day.date < query.from) return []
    if (query.to != null && day.date > query.to) return []
    return [
      {
        date: day.date,
        biomassGrams: day.biomassGrams,
        deaths: day.deaths,
      },
    ]
  })
  return { pondCode: query.pondCode, points }
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
    fishSpeciesName: cycle.fishSpeciesName,
    cultivationMethodName: cycle.cultivationMethodName,
    fcr: cycle.fcr,
    totalDeaths: cycle.totalDeaths,
    cultureStart: cycle.cultureStart,
    todayWeightGrams: cycle.todayWeightGrams,
    todayDeaths: cycle.todayDeaths,
    todayFeedGrams: cycle.todayFeedGrams,
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
  const primary = compareNullable(
    left[query.sortId],
    right[query.sortId],
    query.sortDesc,
  )
  if (primary !== 0) return primary
  return compareNullable(left.doc, right.doc, false)
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

function cycleSummary(cycle: {
  dailyRecords: Array<{
    doc: number
    observedOn: Date | null
    averageWeightGrams: { toString: () => string } | null
    frMin: { toString: () => string } | null
    frMax: { toString: () => string } | null
  }>
  mortalityEvents: Array<{ occurredAt: Date; quantity: number }>
  feedApplications: Array<{ occurredAt: Date; quantityGrams: number }>
  stockings: Array<{ occurredOn: Date; quantity: number }>
  fastingPatterns: Array<{
    feedDayCount: number
    fastDayCount: number
    anchorOn: Date
    effectiveFrom: Date
  }>
  fastingOverrides: Array<{
    startsAt: Date
    endsAt: Date
    reason: string
    revokedAt: Date | null
  }>
}) {
  const deaths = sumOn(cycle.mortalityEvents)
  const actual = sumOn(
    cycle.feedApplications.map((event) => ({
      occurredAt: event.occurredAt,
      quantity: event.quantityGrams,
    })),
  )
  const sources: PondDaySource[] = cycle.dailyRecords.map((record) => {
    const date = record.observedOn ? formatJakartaDate(record.observedOn) : null
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
  const cultureStart = stockings.reduce<string | null>((earliest, stocking) => {
    if (earliest == null || stocking.occurredOn < earliest) {
      return stocking.occurredOn
    }
    return earliest
  }, null)
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
  return {
    summary: summarizePondCycle(sources, stockings, schedule, cultureStart),
    sources,
    stockings,
    schedule,
    cultureStart,
  }
}

function todayReport(
  records: ReadonlyArray<{
    observedOn: Date | null
    averageWeightGrams: { toString: () => string } | null
    deathsReported: boolean
    feedReported: boolean
  }>,
  deaths: ReadonlyMap<string, number>,
  feed: ReadonlyMap<string, number>,
  today: string,
) {
  const record = records.find(
    (item) =>
      item.observedOn != null && formatJakartaDate(item.observedOn) === today,
  )
  return {
    todayWeightGrams: record ? asNumber(record.averageWeightGrams) : null,
    todayDeaths: record?.deathsReported ? (deaths.get(today) ?? 0) : null,
    todayFeedGrams: record?.feedReported ? (feed.get(today) ?? 0) : null,
  }
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
  fishSpecies: true,
  cultivationMethod: true,
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
    const { summary, sources, stockings, schedule, cultureStart } =
      cycleSummary(cycle)
    const deathsByDay = sumOn(cycle.mortalityEvents)
    const feedByDay = sumOn(
      cycle.feedApplications.map((event) => ({
        occurredAt: event.occurredAt,
        quantity: event.quantityGrams,
      })),
    )
    const today = todayReport(
      cycle.dailyRecords,
      deathsByDay,
      feedByDay,
      prepareOn,
    )
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
      fishSpeciesName: cycle.fishSpecies.name,
      cultivationMethodName: cycle.cultivationMethod.name,
      fcr: feedConversionRatio(
        totalActual,
        summary.initialBiomassGrams,
        summary.latestBiomassGrams,
      ),
      totalDeaths: summary.rows.reduce((sum, day) => sum + day.deaths, 0),
      cultureStart,
      todayWeightGrams: today.todayWeightGrams,
      todayDeaths: today.todayDeaths,
      todayFeedGrams: today.todayFeedGrams,
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

/** Saved weight, deaths, and actual feed for one reporting date, if a row exists. */
export async function pondDayDraft(input: PondDayLookup) {
  const observedOn = new Date(`${input.date}T00:00:00.000Z`)
  const record = await prisma.pondDailyRecord.findFirst({
    where: { batchPondId: input.batchPondId, observedOn },
    select: {
      averageWeightGrams: true,
      deathsReported: true,
      feedReported: true,
    },
  })
  if (!record) return null

  const dayStart = jakartaDayStart(input.date)
  const dayEnd = jakartaDayStart(addDays(input.date, 1))
  const occurredAt = { gte: dayStart, lt: dayEnd }
  const [deaths, feed] = await Promise.all([
    record.deathsReported
      ? prisma.mortalityEvent.aggregate({
          where: { batchPondId: input.batchPondId, occurredAt },
          _sum: { quantity: true },
        })
      : null,
    record.feedReported
      ? prisma.feedApplication.aggregate({
          where: { batchPondId: input.batchPondId, occurredAt },
          _sum: { quantityGrams: true },
        })
      : null,
  ])

  return {
    averageWeightGrams: asNumber(record.averageWeightGrams),
    deaths: deaths?._sum.quantity ?? 0,
    actualFeedGrams: feed?._sum.quantityGrams ?? 0,
  }
}

/** True when this cycle already has a daily row on the reporting date. */
export async function pondDayExists(input: PondDayLookup) {
  const observedOn = new Date(`${input.date}T00:00:00.000Z`)
  const record = await prisma.pondDailyRecord.findFirst({
    where: { batchPondId: input.batchPondId, observedOn },
    select: { id: true },
  })
  return record != null
}

/**
 * Writes one part of a day, or the whole historical day. Deaths and actual
 * feed replace that date's events. A recorded zero sets the flag and stores
 * no event. Feeding rate is snapshotted from the weight. Derived columns
 * are not stored.
 */
export async function upsertPondDay(input: PondDayPatch, userId: string) {
  const observedOn = new Date(`${input.date}T00:00:00.000Z`)
  const dayStart = jakartaDayStart(input.date)
  const dayEnd = jakartaDayStart(addDays(input.date, 1))
  const feedGrams =
    input.kind === 'feed' || input.kind === 'day' ? input.actualFeedGrams : 0

  try {
    await prisma.$transaction(async (tx) => {
      const cycle = await tx.batchPond.findUnique({
        where: { id: input.batchPondId },
        select: {
          id: true,
          feedId: true,
          stockings: {
            select: { occurredOn: true },
            orderBy: { occurredOn: 'asc' },
            take: 1,
          },
        },
      })
      if (!cycle) throw new KolamError(NOT_FOUND)
      if (cycle.stockings.length === 0) throw new KolamError(NOT_STOCKED)
      const cultureStart = formatJakartaDate(cycle.stockings[0].occurredOn)
      if (input.date < cultureStart) throw new KolamError(BEFORE_STOCKING)
      if (feedGrams > 0 && cycle.feedId == null) throw new KolamError(NO_FEED)

      const records = await tx.pondDailyRecord.findMany({
        where: { batchPondId: cycle.id },
        select: { id: true, doc: true, observedOn: true },
      })
      const found = records.find(
        (record) =>
          record.observedOn != null &&
          formatJakartaDate(record.observedOn) === input.date,
      )
      const record =
        found ??
        (await tx.pondDailyRecord.create({
          data: {
            batchPondId: cycle.id,
            doc: records.reduce((max, item) => Math.max(max, item.doc), 0) + 1,
            observedOn,
          },
          select: { id: true, doc: true, observedOn: true },
        }))

      if (input.kind === 'weight' || input.kind === 'day') {
        const rate =
          input.averageWeightGrams == null
            ? null
            : feedingRateForWeight(
                input.averageWeightGrams,
                (
                  await tx.feedingRateBand.findMany({
                    select: {
                      minWeightGrams: true,
                      frMin: true,
                      frMax: true,
                    },
                  })
                ).map((band) => ({
                  minWeightGrams: Number(band.minWeightGrams),
                  frMin: Number(band.frMin),
                  frMax: Number(band.frMax),
                })),
              )
        await tx.pondDailyRecord.update({
          where: { id: record.id },
          data: {
            averageWeightGrams: decimal(input.averageWeightGrams, 3),
            frMin: decimal(rate?.frMin ?? null, 4),
            frMax: decimal(rate?.frMax ?? null, 4),
          },
        })
      }

      if (input.kind === 'deaths' || input.kind === 'day') {
        await tx.pondDailyRecord.update({
          where: { id: record.id },
          data: { deathsReported: true },
        })
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
      }

      if (input.kind === 'feed' || input.kind === 'day') {
        await tx.pondDailyRecord.update({
          where: { id: record.id },
          data: { feedReported: true },
        })
        await tx.feedApplication.deleteMany({
          where: {
            batchPondId: cycle.id,
            occurredAt: { gte: dayStart, lt: dayEnd },
          },
        })
        if (input.actualFeedGrams > 0 && cycle.feedId != null) {
          await tx.feedApplication.create({
            data: {
              batchPondId: cycle.id,
              feedId: cycle.feedId,
              quantityGrams: input.actualFeedGrams,
              occurredAt: dayStart,
              userId,
            },
          })
        }
      }
    })
  } catch (error) {
    if (error instanceof KolamError) throw error
    if (prismaErrorCode(error) === 'P2002') throw new KolamError(DAY_CONFLICT)
    throw error
  }
}

async function activeCycleIdForPond(pondCode: string) {
  const cycle = await prisma.batchPond.findFirst({
    where: {
      pond: { code: pondCode },
      batch: { name: BATCH_NAME },
    },
    select: { id: true },
  })
  return cycle?.id ?? null
}

function toTreatmentLogItem(row: {
  id: string
  treatmentId: string
  quantityGrams: number
  occurredAt: Date
  treatment: { code: string; name: string }
  user: { name: string }
}): TreatmentLogItem {
  return {
    id: row.id,
    treatmentId: row.treatmentId,
    treatmentCode: row.treatment.code,
    treatmentName: row.treatment.name,
    quantityGrams: row.quantityGrams,
    occurredAt: row.occurredAt.toISOString(),
    userName: row.user.name,
  }
}

function occurredAtFromWall(input: {
  date: string
  time: string
  timeZone: string
}) {
  try {
    return zonedDateTime(input.date, input.time, input.timeZone)
  } catch {
    throw new KolamError(BAD_WALL_CLOCK)
  }
}

/** Master list for the treatment picker. */
export async function listTreatments(): Promise<Array<TreatmentOption>> {
  const rows = await prisma.treatment.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, code: true, name: true },
  })
  return rows
}

/** Planned treatments for this cycle (information only). */
export async function getKolamTreatmentPlan(
  query: TreatmentPlanQuery,
): Promise<TreatmentPlan> {
  const batchPondId = await activeCycleIdForPond(query.pondCode)
  if (!batchPondId) throw new KolamError(NOT_FOUND)
  const rows = await prisma.batchPondTreatment.findMany({
    where: { batchPondId },
    orderBy: { treatment: { name: 'asc' } },
    select: { treatment: { select: { id: true, code: true, name: true } } },
  })
  return {
    pondCode: query.pondCode,
    treatments: rows.map((row) => row.treatment),
  }
}

export async function listKolamTreatments(
  query: TreatmentLogQuery,
): Promise<{ rows: Array<TreatmentLogItem>; rowCount: number }> {
  const batchPondId = await activeCycleIdForPond(query.pondCode)
  if (!batchPondId) throw new KolamError(NOT_FOUND)

  const occurredAt =
    query.from != null && query.to != null && query.timeZone != null
      ? {
          gte: occurredAtFromWall({
            date: query.from,
            time: '00:00',
            timeZone: query.timeZone,
          }),
          lt: occurredAtFromWall({
            date: addDays(query.to, 1),
            time: '00:00',
            timeZone: query.timeZone,
          }),
        }
      : undefined

  const where = {
    batchPondId,
    revokedAt: null,
    ...(occurredAt ? { occurredAt } : {}),
  }
  const [rowCount, rows] = await prisma.$transaction([
    prisma.treatmentLog.count({ where }),
    prisma.treatmentLog.findMany({
      where,
      orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      skip: query.pageIndex * query.pageSize,
      take: query.pageSize,
      include: {
        treatment: { select: { code: true, name: true } },
        user: { select: { name: true } },
      },
    }),
  ])

  return {
    rowCount,
    rows: rows.map(toTreatmentLogItem),
  }
}

export async function createTreatmentLog(
  input: TreatmentLogInput,
  userId: string,
) {
  const cycle = await prisma.batchPond.findUnique({
    where: { id: input.batchPondId },
    select: { id: true },
  })
  if (!cycle) throw new KolamError(NOT_FOUND)

  const treatment = await prisma.treatment.findUnique({
    where: { id: input.treatmentId },
    select: { id: true },
  })
  if (!treatment) throw new KolamError(TREATMENT_NOT_FOUND)

  const occurredAt = occurredAtFromWall(input)
  await prisma.treatmentLog.create({
    data: {
      batchPondId: input.batchPondId,
      treatmentId: input.treatmentId,
      quantityGrams: input.quantityGrams,
      occurredAt,
      userId,
    },
  })
}

export async function updateTreatmentLog(input: TreatmentLogUpdate) {
  const log = await prisma.treatmentLog.findUnique({ where: { id: input.id } })
  if (!log) throw new KolamError(LOG_NOT_FOUND)
  if (log.revokedAt) throw new KolamError(LOG_REVOKED)

  const treatment = await prisma.treatment.findUnique({
    where: { id: input.treatmentId },
    select: { id: true },
  })
  if (!treatment) throw new KolamError(TREATMENT_NOT_FOUND)

  const occurredAt = occurredAtFromWall(input)
  await prisma.treatmentLog.update({
    where: { id: input.id },
    data: {
      treatmentId: input.treatmentId,
      quantityGrams: input.quantityGrams,
      occurredAt,
    },
  })
}

export async function revokeTreatmentLog(id: string, userId: string) {
  const log = await prisma.treatmentLog.findUnique({ where: { id } })
  if (!log) throw new KolamError(LOG_NOT_FOUND)
  if (log.revokedAt) throw new KolamError(LOG_REVOKED)

  await prisma.treatmentLog.update({
    where: { id },
    data: { revokedAt: new Date(), revokedById: userId },
  })
}
