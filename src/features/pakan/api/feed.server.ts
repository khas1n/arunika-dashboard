import { prisma } from '#/lib/db.server'
import type {
  FeedIdInput,
  FeedInput,
  FeedItem,
  FeedList,
  FeedListQuery,
  FeedUpdateInput,
} from '#/features/pakan/schemas/feed'

/** An error whose message is safe and meant to be shown to the user. */
export class FeedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FeedError'
  }
}

const NOT_FOUND = 'Jenis pakan tidak ditemukan.'
const DUPLICATE = 'Jenis pakan dengan nama ini sudah ada.'
const IN_USE = 'Jenis pakan sudah dipakai dan tidak bisa dihapus.'

const usageSelect = {
  select: {
    batchPonds: true,
    feedReceipts: true,
    feedApplications: true,
    stockOpnames: true,
    bibisRecords: true,
  },
} as const

function prismaErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    return typeof error.code === 'string' ? error.code : undefined
  }
  return undefined
}

function toFeedItem(row: {
  id: string
  name: string
  createdAt: Date
  _count: Record<string, number>
}): FeedItem {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt,
    usageCount: Object.values(row._count).reduce((sum, n) => sum + n, 0),
  }
}

async function assertNameFree(name: string, exceptId?: string) {
  const existing = await prisma.feed.findFirst({
    where: {
      name: { equals: name, mode: 'insensitive' },
      ...(exceptId ? { id: { not: exceptId } } : {}),
    },
    select: { id: true },
  })
  if (existing) throw new FeedError(DUPLICATE)
}

export async function listFeeds(query: FeedListQuery): Promise<FeedList> {
  const search = query.search.trim()
  const where = search
    ? { name: { contains: search, mode: 'insensitive' as const } }
    : {}
  const direction = query.sortDesc ? ('desc' as const) : ('asc' as const)
  const orderBy =
    query.sortId === 'createdAt'
      ? { createdAt: direction }
      : { name: direction }

  const [rows, rowCount] = await prisma.$transaction([
    prisma.feed.findMany({
      where,
      orderBy,
      skip: query.pageIndex * query.pageSize,
      take: query.pageSize,
      include: { _count: usageSelect },
    }),
    prisma.feed.count({ where }),
  ])

  return { rows: rows.map(toFeedItem), rowCount }
}

export async function createFeed(input: FeedInput): Promise<FeedItem> {
  await assertNameFree(input.name)
  try {
    const row = await prisma.feed.create({
      data: { name: input.name },
      include: { _count: usageSelect },
    })
    return toFeedItem(row)
  } catch (error) {
    // Two requests can pass the check above together. The unique index decides.
    if (prismaErrorCode(error) === 'P2002') throw new FeedError(DUPLICATE)
    throw error
  }
}

export async function updateFeed(input: FeedUpdateInput): Promise<FeedItem> {
  await assertNameFree(input.name, input.id)
  try {
    const row = await prisma.feed.update({
      where: { id: input.id },
      data: { name: input.name },
      include: { _count: usageSelect },
    })
    return toFeedItem(row)
  } catch (error) {
    const code = prismaErrorCode(error)
    if (code === 'P2002') throw new FeedError(DUPLICATE)
    if (code === 'P2025') throw new FeedError(NOT_FOUND)
    throw error
  }
}

export async function deleteFeed(input: FeedIdInput): Promise<FeedIdInput> {
  try {
    await prisma.feed.delete({ where: { id: input.id } })
    return { id: input.id }
  } catch (error) {
    // Foreign keys are Restrict: a feed with receipts, applications, opnames,
    // bibis records, or cycles cannot be removed, and history stays intact.
    const code = prismaErrorCode(error)
    if (code === 'P2003') throw new FeedError(IN_USE)
    if (code === 'P2025') throw new FeedError(NOT_FOUND)
    throw error
  }
}
