import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma/client.js'
import {
  addDays,
  todayInJakarta,
} from '../src/features/pakan/domain/feeding-schedule.ts'

const RECEIPT_GRAMS = 50_000
const BIBIS_GRAMS = 5_000

/**
 * One receipt and one bibis row per feed that is missing them.
 * Re-running does not add a second receipt. A feed that already has stock
 * is left alone. No opname is written.
 */
async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL is missing')
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  })

  try {
    const user = await prisma.user.findFirst({ select: { id: true } })
    if (!user) throw new Error('No user to own the rows')
    const feeds = await prisma.feed.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
    const batch = await prisma.batch.findFirst({
      select: { bibisLeadDays: true },
      orderBy: { createdAt: 'asc' },
    })
    const feedingDay = addDays(todayInJakarta(), batch?.bibisLeadDays ?? 2)
    const feedingOn = new Date(`${feedingDay}T00:00:00.000Z`)
    const lines: Array<string> = []

    for (const feed of feeds) {
      const receiptKey = `opening-receipt:${feed.id}`
      const existingReceipt = await prisma.feedReceipt.findUnique({
        where: { clientRequestId: receiptKey },
        select: { id: true },
      })
      if (!existingReceipt) {
        const [received, consumed, adjusted] = await Promise.all([
          prisma.feedReceipt.aggregate({
            where: { feedId: feed.id },
            _sum: { quantityGrams: true },
          }),
          prisma.feedApplication.aggregate({
            where: { feedId: feed.id },
            _sum: { quantityGrams: true },
          }),
          prisma.stockOpname.aggregate({
            where: { feedId: feed.id },
            _sum: { adjustmentGrams: true },
          }),
        ])
        const stock =
          (received._sum.quantityGrams ?? 0) -
          (consumed._sum.quantityGrams ?? 0) +
          (adjusted._sum.adjustmentGrams ?? 0)
        if (stock < 0) {
          const earliest = await prisma.feedApplication.findFirst({
            where: { feedId: feed.id },
            orderBy: { occurredAt: 'asc' },
            select: { occurredAt: true },
          })
          const occurredAt = earliest
            ? new Date(earliest.occurredAt.getTime() - 24 * 60 * 60 * 1000)
            : new Date()
          await prisma.feedReceipt.create({
            data: {
              feedId: feed.id,
              quantityGrams: RECEIPT_GRAMS,
              occurredAt,
              userId: user.id,
              clientRequestId: receiptKey,
            },
          })
          lines.push(
            `${feed.name}: receipt ${RECEIPT_GRAMS} g, stock was ${stock} g`,
          )
        }
      }

      const bibisKey = `opening-bibis:${feed.id}:${feedingDay}`
      const existingBibis = await prisma.bibisRecord.findFirst({
        where: { feedId: feed.id, feedingOn },
        select: { id: true },
      })
      if (!existingBibis) {
        await prisma.bibisRecord.create({
          data: {
            feedId: feed.id,
            feedingOn,
            quantityGrams: BIBIS_GRAMS,
            preparedAt: new Date(),
            userId: user.id,
            clientRequestId: bibisKey,
          },
        })
        lines.push(`${feed.name}: bibis ${BIBIS_GRAMS} g for ${feedingDay}`)
      }
    }

    console.log(lines.length > 0 ? lines.join('\n') : 'Nothing to add')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Record failed'
  console.error(message)
  process.exit(1)
})
