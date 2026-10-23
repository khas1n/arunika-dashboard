import { prisma } from '#/lib/db.server'
import { slicePage } from '#/lib/page'
import {
  feedStockGrams,
  projectFeedBibis,
} from '#/features/pakan/domain/feed-stock'
import type { PondBibisNeed } from '#/features/pakan/domain/feed-stock'
import {
  formatJakartaDate,
  getBibisForDay,
  todayInJakarta,
} from '#/features/pakan/domain/feeding-schedule'
import { projectedCalculatedFeedGrams } from '#/features/pakan/domain/pond-day'
import type { PondDaySource } from '#/features/pakan/domain/pond-day'
import { zonedDateTime } from '#/features/pakan/domain/zoned-datetime'
import type {
  ActivityPage,
  ActivityQuery,
  ActivityRow,
  BibisInput,
  InventoryOverview,
  InventoryWriteResult,
  OpnameInput,
  ReceiptInput,
  StockRow,
} from '#/features/pakan/schemas/inventory'

/** The farm's current production batch. Cycles outside it are history, not a forecast. */
const BATCH_NAME = 'BATCH 1'

const NOT_FOUND = 'Jenis pakan tidak ditemukan.'
const REPLAY_MISMATCH = 'Permintaan ini sudah dipakai untuk catatan lain.'
const NEGATIVE_STOCK =
  'Stok sistem negatif, jadi hitung fisik tidak bisa dicatat. Tambah pakan terlebih dahulu.'

export class InventoryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InventoryError'
  }
}

function asNumber(value: { toString: () => string } | null): number | null {
  if (value == null) return null
  return Number(value.toString())
}

function prismaErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    return typeof error.code === 'string' ? error.code : undefined
  }
  return undefined
}

function occurredAt(input: {
  date: string
  time: string
  timeZone: string
}): Date {
  try {
    return zonedDateTime(input.date, input.time, input.timeZone)
  } catch (error) {
    throw new InventoryError(
      error instanceof Error ? error.message : 'Waktu tidak valid.',
    )
  }
}

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

async function lockFeed(tx: Tx, feedId: string) {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "feed" WHERE "id" = ${feedId} FOR UPDATE
  `
  if (rows.length === 0) throw new InventoryError(NOT_FOUND)
}

async function stockParts(tx: Tx, feedId: string) {
  const [received, consumed, adjusted] = await Promise.all([
    tx.feedReceipt.aggregate({
      where: { feedId },
      _sum: { quantityGrams: true },
    }),
    tx.feedApplication.aggregate({
      where: { feedId },
      _sum: { quantityGrams: true },
    }),
    tx.stockOpname.aggregate({
      where: { feedId },
      _sum: { adjustmentGrams: true },
    }),
  ])
  return {
    receivedGrams: received._sum.quantityGrams ?? 0,
    consumedGrams: consumed._sum.quantityGrams ?? 0,
    adjustmentGrams: adjusted._sum.adjustmentGrams ?? 0,
  }
}

function replay(id: string): InventoryWriteResult {
  return { id, replayed: true }
}

function sumByFeed(
  rows: Array<{ feedId: string; _sum: { quantityGrams: number | null } }>,
) {
  return new Map(rows.map((row) => [row.feedId, row._sum.quantityGrams ?? 0]))
}

export async function listInventoryOverview(): Promise<InventoryOverview> {
  const prepareOn = todayInJakarta()
  const [
    feeds,
    receiptGroups,
    applicationGroups,
    opnameGroups,
    receipts,
    batch,
    preparedRows,
  ] = await Promise.all([
    prisma.feed.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
    prisma.feedReceipt.groupBy({
      by: ['feedId'],
      _sum: { quantityGrams: true },
    }),
    prisma.feedApplication.groupBy({
      by: ['feedId'],
      _sum: { quantityGrams: true },
    }),
    prisma.stockOpname.groupBy({
      by: ['feedId'],
      _sum: { adjustmentGrams: true },
    }),
    prisma.feedReceipt.findMany({
      orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
      select: {
        feedId: true,
        quantityGrams: true,
        occurredAt: true,
        note: true,
      },
    }),
    prisma.batch.findUnique({
      where: { name: BATCH_NAME },
      include: {
        batchPonds: {
          include: {
            pond: { select: { code: true } },
            fastingPatterns: true,
            fastingOverrides: true,
            stockings: { select: { occurredOn: true, quantity: true } },
            dailyRecords: {
              select: {
                doc: true,
                observedOn: true,
                averageWeightGrams: true,
                frMin: true,
                frMax: true,
              },
            },
            mortalityEvents: { select: { occurredAt: true, quantity: true } },
            feedApplications: {
              select: { occurredAt: true, quantityGrams: true },
            },
          },
        },
      },
    }),
    prisma.bibisRecord.findMany({
      select: { feedId: true, feedingOn: true, quantityGrams: true },
    }),
  ])

  const received = sumByFeed(receiptGroups)
  const consumed = sumByFeed(applicationGroups)
  const adjusted = new Map(
    opnameGroups.map((row) => [row.feedId, row._sum.adjustmentGrams ?? 0]),
  )
  const lastReceipt = new Map<string, StockRow['lastReceipt']>()
  for (const row of receipts) {
    if (lastReceipt.has(row.feedId)) continue
    lastReceipt.set(row.feedId, {
      quantityGrams: row.quantityGrams,
      occurredAt: row.occurredAt,
      note: row.note,
    })
  }

  const stocks: Array<StockRow> = feeds.map((feed) => {
    const parts = {
      receivedGrams: received.get(feed.id) ?? 0,
      consumedGrams: consumed.get(feed.id) ?? 0,
      adjustmentGrams: adjusted.get(feed.id) ?? 0,
    }
    return {
      feedId: feed.id,
      feedName: feed.name,
      ...parts,
      stockGrams: feedStockGrams(parts),
      lastReceipt: lastReceipt.get(feed.id) ?? null,
    }
  })

  const ponds: PondBibisNeed[] = []
  for (const cycle of batch?.batchPonds ?? []) {
    const deaths = new Map<string, number>()
    for (const event of cycle.mortalityEvents) {
      const date = formatJakartaDate(event.occurredAt)
      deaths.set(date, (deaths.get(date) ?? 0) + event.quantity)
    }
    const actual = new Map<string, number>()
    for (const event of cycle.feedApplications) {
      const date = formatJakartaDate(event.occurredAt)
      actual.set(date, (actual.get(date) ?? 0) + event.quantityGrams)
    }
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
    const bibis = getBibisForDay(
      prepareOn,
      [
        {
          batchPondId: cycle.id,
          schedule,
          getCalculatedFeedGrams: (feedingOn) =>
            projectedCalculatedFeedGrams(feedingOn, sources, stockings),
          getPreparedGrams: () => 0,
        },
      ],
      batch?.bibisLeadDays ?? 2,
    )
    const item = bibis.items[0]
    ponds.push({
      batchPondId: cycle.id,
      pondCode: cycle.pond.code,
      feedId: cycle.feedId,
      feedingOn: item.feedingOn,
      requiredGrams: item.requiredGrams,
      fasting: item.fastingReason != null,
    })
  }

  const prepared = new Map<string, number>()
  for (const row of preparedRows) {
    const key = `${row.feedId}\0${formatJakartaDate(row.feedingOn)}`
    prepared.set(key, (prepared.get(key) ?? 0) + row.quantityGrams)
  }

  const projection = projectFeedBibis({
    feeds: stocks.map((row) => ({
      feedId: row.feedId,
      feedName: row.feedName,
      receivedGrams: row.receivedGrams,
      consumedGrams: row.consumedGrams,
      adjustmentGrams: row.adjustmentGrams,
    })),
    prepared: [...prepared.entries()].map(([key, quantityGrams]) => {
      const split = key.indexOf('\0')
      return {
        feedId: key.slice(0, split),
        feedingOn: key.slice(split + 1),
        quantityGrams,
      }
    }),
    ponds,
  })

  return {
    prepareOn,
    stocks,
    bibis: projection.rows,
    unassignedPonds: projection.unassignedPonds,
  }
}

const activityTypeLabel = {
  receipt: 'penerimaan',
  bibis: 'bibis',
  application: 'pemberian',
  opname: 'opname',
} as const

export async function listInventoryActivity(
  query: ActivityQuery,
): Promise<ActivityPage> {
  const [receipts, bibis, applications, opnames] = await Promise.all([
    prisma.feedReceipt.findMany({
      orderBy: { occurredAt: 'desc' },
      include: {
        feed: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.bibisRecord.findMany({
      orderBy: { preparedAt: 'desc' },
      include: {
        feed: { select: { name: true } },
        user: { select: { name: true } },
        batchPond: { select: { pond: { select: { code: true } } } },
      },
    }),
    prisma.feedApplication.findMany({
      orderBy: { occurredAt: 'desc' },
      include: {
        feed: { select: { name: true } },
        user: { select: { name: true } },
        batchPond: { select: { pond: { select: { code: true } } } },
      },
    }),
    prisma.stockOpname.findMany({
      orderBy: { occurredAt: 'desc' },
      include: {
        feed: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
  ])

  const rows: Array<ActivityRow> = [
    ...receipts.map((row) => ({
      id: `receipt:${row.id}`,
      sourceId: row.id,
      type: 'receipt' as const,
      occurredAt: row.occurredAt,
      feedId: row.feedId,
      feedName: row.feed.name,
      quantityGrams: row.quantityGrams,
      pondCode: null,
      userName: row.user.name,
      note: row.note,
    })),
    ...bibis.map((row) => ({
      id: `bibis:${row.id}`,
      sourceId: row.id,
      type: 'bibis' as const,
      occurredAt: row.preparedAt,
      feedId: row.feedId,
      feedName: row.feed.name,
      quantityGrams: row.quantityGrams,
      pondCode: row.batchPond?.pond.code ?? null,
      userName: row.user.name,
      note: row.note,
    })),
    ...applications.map((row) => ({
      id: `application:${row.id}`,
      sourceId: row.id,
      type: 'application' as const,
      occurredAt: row.occurredAt,
      feedId: row.feedId,
      feedName: row.feed.name,
      quantityGrams: row.quantityGrams,
      pondCode: row.batchPond.pond.code,
      userName: row.user.name,
      note: row.note,
    })),
    ...opnames.map((row) => ({
      id: `opname:${row.id}`,
      sourceId: row.id,
      type: 'opname' as const,
      occurredAt: row.occurredAt,
      feedId: row.feedId,
      feedName: row.feed.name,
      quantityGrams: row.adjustmentGrams,
      pondCode: null,
      userName: row.user.name,
      note: row.note,
    })),
  ]

  const needle = query.search.trim().toLowerCase()
  const filtered = rows.filter((row) => {
    if (query.type !== 'all' && row.type !== query.type) return false
    if (query.feedId && row.feedId !== query.feedId) return false
    if (
      query.occurredOn &&
      formatJakartaDate(row.occurredAt) !== query.occurredOn
    ) {
      return false
    }
    if (needle.length === 0) return true
    const haystack = [
      activityTypeLabel[row.type],
      row.feedName,
      row.pondCode ?? '',
      row.userName,
      row.note ?? '',
    ]
      .join(' ')
      .toLowerCase()
    return haystack.includes(needle)
  })

  filtered.sort((left, right) => {
    let primary = 0
    if (query.sortId === 'occurredAt') {
      primary = left.occurredAt.getTime() - right.occurredAt.getTime()
    } else if (query.sortId === 'type') {
      primary = left.type.localeCompare(right.type, 'id')
    } else if (query.sortId === 'feedName') {
      primary = left.feedName.localeCompare(right.feedName, 'id')
    } else {
      primary = left.quantityGrams - right.quantityGrams
    }
    if (primary !== 0) return query.sortDesc ? -primary : primary
    return right.occurredAt.getTime() - left.occurredAt.getTime()
  })

  return slicePage(filtered, query)
}

export async function createFeedReceipt(
  input: ReceiptInput,
  userId: string,
): Promise<InventoryWriteResult> {
  const at = occurredAt(input)
  try {
    return await prisma.$transaction(async (tx) => {
      await lockFeed(tx, input.feedId)
      const existing = await tx.feedReceipt.findUnique({
        where: { clientRequestId: input.clientRequestId },
      })
      if (existing) {
        if (
          existing.feedId !== input.feedId ||
          existing.quantityGrams !== input.quantityGrams
        ) {
          throw new InventoryError(REPLAY_MISMATCH)
        }
        return replay(existing.id)
      }
      const row = await tx.feedReceipt.create({
        data: {
          feedId: input.feedId,
          quantityGrams: input.quantityGrams,
          occurredAt: at,
          userId,
          note: input.note,
          clientRequestId: input.clientRequestId,
        },
        select: { id: true },
      })
      return { id: row.id, replayed: false }
    })
  } catch (error) {
    if (error instanceof InventoryError) throw error
    if (prismaErrorCode(error) === 'P2002') {
      const existing = await prisma.feedReceipt.findUnique({
        where: { clientRequestId: input.clientRequestId },
      })
      if (
        existing &&
        existing.feedId === input.feedId &&
        existing.quantityGrams === input.quantityGrams
      ) {
        return replay(existing.id)
      }
      throw new InventoryError(REPLAY_MISMATCH)
    }
    if (prismaErrorCode(error) === 'P2003') throw new InventoryError(NOT_FOUND)
    throw error
  }
}

export async function createBibisRecord(
  input: BibisInput,
  userId: string,
): Promise<InventoryWriteResult> {
  const at = occurredAt(input)
  const feedingOn = new Date(`${input.feedingOn}T00:00:00.000Z`)
  try {
    return await prisma.$transaction(async (tx) => {
      await lockFeed(tx, input.feedId)
      const existing = await tx.bibisRecord.findUnique({
        where: { clientRequestId: input.clientRequestId },
      })
      if (existing) {
        if (
          existing.feedId !== input.feedId ||
          existing.quantityGrams !== input.quantityGrams ||
          formatJakartaDate(existing.feedingOn) !== input.feedingOn
        ) {
          throw new InventoryError(REPLAY_MISMATCH)
        }
        return replay(existing.id)
      }
      const row = await tx.bibisRecord.create({
        data: {
          feedId: input.feedId,
          feedingOn,
          quantityGrams: input.quantityGrams,
          preparedAt: at,
          userId,
          note: input.note,
          clientRequestId: input.clientRequestId,
        },
        select: { id: true },
      })
      return { id: row.id, replayed: false }
    })
  } catch (error) {
    if (error instanceof InventoryError) throw error
    if (prismaErrorCode(error) === 'P2002') {
      const existing = await prisma.bibisRecord.findUnique({
        where: { clientRequestId: input.clientRequestId },
      })
      if (
        existing &&
        existing.feedId === input.feedId &&
        existing.quantityGrams === input.quantityGrams &&
        formatJakartaDate(existing.feedingOn) === input.feedingOn
      ) {
        return replay(existing.id)
      }
      throw new InventoryError(REPLAY_MISMATCH)
    }
    if (prismaErrorCode(error) === 'P2003') throw new InventoryError(NOT_FOUND)
    throw error
  }
}

export async function createStockOpname(
  input: OpnameInput,
  userId: string,
): Promise<InventoryWriteResult> {
  const at = occurredAt(input)
  try {
    return await prisma.$transaction(async (tx) => {
      await lockFeed(tx, input.feedId)
      const existing = await tx.stockOpname.findUnique({
        where: { clientRequestId: input.clientRequestId },
      })
      if (existing) {
        if (
          existing.feedId !== input.feedId ||
          existing.physicalQuantityGrams !== input.physicalQuantityGrams
        ) {
          throw new InventoryError(REPLAY_MISMATCH)
        }
        return replay(existing.id)
      }
      const parts = await stockParts(tx, input.feedId)
      const systemQuantityGrams = feedStockGrams(parts)
      if (systemQuantityGrams < 0) throw new InventoryError(NEGATIVE_STOCK)
      const row = await tx.stockOpname.create({
        data: {
          feedId: input.feedId,
          systemQuantityGrams,
          physicalQuantityGrams: input.physicalQuantityGrams,
          adjustmentGrams: input.physicalQuantityGrams - systemQuantityGrams,
          occurredAt: at,
          userId,
          note: input.note,
          clientRequestId: input.clientRequestId,
        },
        select: { id: true },
      })
      return { id: row.id, replayed: false }
    })
  } catch (error) {
    if (error instanceof InventoryError) throw error
    if (prismaErrorCode(error) === 'P2002') {
      const existing = await prisma.stockOpname.findUnique({
        where: { clientRequestId: input.clientRequestId },
      })
      if (
        existing &&
        existing.feedId === input.feedId &&
        existing.physicalQuantityGrams === input.physicalQuantityGrams
      ) {
        return replay(existing.id)
      }
      throw new InventoryError(REPLAY_MISMATCH)
    }
    if (prismaErrorCode(error) === 'P2003') throw new InventoryError(NOT_FOUND)
    throw error
  }
}
