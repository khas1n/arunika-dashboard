/* eslint-disable @typescript-eslint/consistent-type-imports --
   typeof import() keeps the database module out of collection when
   DATABASE_URL is unset. A value import would fail env validation. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const hasDb = Boolean(process.env.DATABASE_URL)

describe.skipIf(!hasDb)('inventory server', () => {
  let prisma!: typeof import('#/lib/db.server').prisma
  let createFeedReceipt!: typeof import('#/features/pakan/api/inventory.server').createFeedReceipt
  let createBibisRecord!: typeof import('#/features/pakan/api/inventory.server').createBibisRecord
  let listInventoryOverview!: typeof import('#/features/pakan/api/inventory.server').listInventoryOverview
  let listInventoryActivity!: typeof import('#/features/pakan/api/inventory.server').listInventoryActivity
  let InventoryError!: typeof import('#/features/pakan/api/inventory.server').InventoryError
  let feedId = ''
  let userId = ''
  let batchPondId = ''
  const receiptIds: Array<string> = []
  const bibisIds: Array<string> = []
  const applicationIds: Array<string> = []

  beforeAll(async () => {
    const server = await import('#/features/pakan/api/inventory.server')
    prisma = (await import('#/lib/db.server')).prisma
    createFeedReceipt = server.createFeedReceipt
    createBibisRecord = server.createBibisRecord
    listInventoryOverview = server.listInventoryOverview
    listInventoryActivity = server.listInventoryActivity
    InventoryError = server.InventoryError

    const user = await prisma.user.findFirst({ select: { id: true } })
    const cycle = await prisma.batchPond.findFirst({
      where: { batch: { name: 'BATCH 1' } },
      select: { id: true },
    })
    if (!user || !cycle) {
      throw new Error('A signed-in user and a BATCH 1 cycle are required.')
    }
    userId = user.id
    batchPondId = cycle.id
    const feed = await prisma.feed.create({
      data: { name: `uji-stok-${Date.now()}` },
    })
    feedId = feed.id
  })

  afterAll(async () => {
    if (feedId === '') return
    await prisma.feedApplication.deleteMany({
      where: { id: { in: applicationIds } },
    })
    await prisma.bibisRecord.deleteMany({ where: { id: { in: bibisIds } } })
    await prisma.feedReceipt.deleteMany({ where: { id: { in: receiptIds } } })
    await prisma.feed.delete({ where: { id: feedId } }).catch(() => undefined)
  })

  it('reduces stock by actual grams and not by prepared bibis', async () => {
    const receipt = await createFeedReceipt(
      {
        feedId,
        quantityGrams: 1000,
        note: null,
        clientRequestId: crypto.randomUUID(),
        date: '2026-10-22',
        time: '08:00',
        timeZone: 'Asia/Jakarta',
      },
      userId,
    )
    receiptIds.push(receipt.id)

    const application = await prisma.feedApplication.create({
      data: {
        batchPondId,
        feedId,
        quantityGrams: 100,
        occurredAt: new Date('2026-10-22T01:00:00.000Z'),
        userId,
      },
      select: { id: true },
    })
    applicationIds.push(application.id)

    const bibis = await createBibisRecord(
      {
        feedId,
        feedingOn: '2026-10-24',
        quantityGrams: 150,
        note: null,
        clientRequestId: crypto.randomUUID(),
        date: '2026-10-22',
        time: '09:00',
        timeZone: 'Asia/Jakarta',
      },
      userId,
    )
    bibisIds.push(bibis.id)

    const overview = await listInventoryOverview()
    const row = overview.stocks.find((item) => item.feedId === feedId)
    expect(row).toMatchObject({
      receivedGrams: 1000,
      consumedGrams: 100,
      stockGrams: 900,
    })
  })

  it('returns the same receipt when the request id is repeated', async () => {
    const clientRequestId = crypto.randomUUID()
    const input = {
      feedId,
      quantityGrams: 250,
      note: null,
      clientRequestId,
      date: '2026-10-22',
      time: '10:00',
      timeZone: 'Asia/Jakarta',
    }
    const first = await createFeedReceipt(input, userId)
    const second = await createFeedReceipt(input, userId)
    receiptIds.push(first.id)
    expect(second).toEqual({ id: first.id, replayed: true })
    const count = await prisma.feedReceipt.count({ where: { clientRequestId } })
    expect(count).toBe(1)
  })

  it('rejects a repeated request id that names a different quantity', async () => {
    const clientRequestId = crypto.randomUUID()
    const first = await createFeedReceipt(
      {
        feedId,
        quantityGrams: 10,
        note: null,
        clientRequestId,
        date: '2026-10-22',
        time: '11:00',
        timeZone: 'Asia/Jakarta',
      },
      userId,
    )
    receiptIds.push(first.id)
    await expect(
      createFeedReceipt(
        {
          feedId,
          quantityGrams: 11,
          note: null,
          clientRequestId,
          date: '2026-10-22',
          time: '11:00',
          timeZone: 'Asia/Jakarta',
        },
        userId,
      ),
    ).rejects.toBeInstanceOf(InventoryError)
  })

  it('keeps an older bibis row on its pond and stores a new one without a pond', async () => {
    const legacy = await prisma.bibisRecord.create({
      data: {
        batchPondId,
        feedId,
        feedingOn: new Date('2026-12-01T00:00:00.000Z'),
        quantityGrams: 40,
        preparedAt: new Date('2026-10-22T02:00:00.000Z'),
        userId,
      },
      select: { id: true, batchPondId: true },
    })
    bibisIds.push(legacy.id)

    const created = await createBibisRecord(
      {
        feedId,
        feedingOn: '2026-12-01',
        quantityGrams: 25,
        note: null,
        clientRequestId: crypto.randomUUID(),
        date: '2026-10-22',
        time: '12:00',
        timeZone: 'Asia/Jakarta',
      },
      userId,
    )
    bibisIds.push(created.id)

    const rows = await prisma.bibisRecord.findMany({
      where: { id: { in: [legacy.id, created.id] } },
      select: { id: true, batchPondId: true },
    })
    expect(rows.find((row) => row.id === legacy.id)?.batchPondId).toBe(
      batchPondId,
    )
    expect(rows.find((row) => row.id === created.id)?.batchPondId).toBeNull()
  })

  it('filters the log to one calendar day and one feed', async () => {
    const early = await createFeedReceipt(
      {
        feedId,
        quantityGrams: 15,
        note: null,
        clientRequestId: crypto.randomUUID(),
        date: '2026-10-01',
        time: '07:00',
        timeZone: 'Asia/Jakarta',
      },
      userId,
    )
    receiptIds.push(early.id)

    const page = await listInventoryActivity({
      pageIndex: 0,
      pageSize: 20,
      search: '',
      sortId: 'occurredAt',
      sortDesc: true,
      type: 'all',
      feedId,
      occurredOn: '2026-10-01',
    })
    expect(page.rows.some((row) => row.sourceId === early.id)).toBe(true)
    expect(page.rows.every((row) => row.feedId === feedId)).toBe(true)
    expect(page.rows.some((row) => row.quantityGrams === 1000)).toBe(false)
  })
})
