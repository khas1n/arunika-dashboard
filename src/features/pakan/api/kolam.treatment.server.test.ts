/* eslint-disable @typescript-eslint/consistent-type-imports --
   typeof import() keeps the database module out of collection when
   DATABASE_URL is unset. A value import would fail env validation. */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

// Import the server only inside the suite. A missing DATABASE_URL must skip
// the file instead of failing env validation while the suite is collected.
const hasDb = Boolean(process.env.DATABASE_URL)

describe.skipIf(!hasDb)('treatment log server', () => {
  let batchPondId = ''
  let treatmentId = ''
  let userId = ''
  const createdIds: Array<string> = []
  let prisma!: typeof import('#/lib/db.server').prisma
  let createTreatmentLog!: typeof import('#/features/pakan/api/kolam.server').createTreatmentLog
  let listKolamTreatments!: typeof import('#/features/pakan/api/kolam.server').listKolamTreatments
  let listTreatments!: typeof import('#/features/pakan/api/kolam.server').listTreatments
  let revokeTreatmentLog!: typeof import('#/features/pakan/api/kolam.server').revokeTreatmentLog
  let updateTreatmentLog!: typeof import('#/features/pakan/api/kolam.server').updateTreatmentLog
  let KolamError!: typeof import('#/features/pakan/api/kolam.server').KolamError

  beforeAll(async () => {
    const server = await import('#/features/pakan/api/kolam.server')
    prisma = (await import('#/lib/db.server')).prisma
    createTreatmentLog = server.createTreatmentLog
    listKolamTreatments = server.listKolamTreatments
    listTreatments = server.listTreatments
    revokeTreatmentLog = server.revokeTreatmentLog
    updateTreatmentLog = server.updateTreatmentLog
    KolamError = server.KolamError

    const cycle = await prisma.batchPond.findFirst({
      where: { batch: { name: 'BATCH 1' }, pond: { code: 'A3' } },
      select: { id: true },
    })
    const treatment = await prisma.treatment.findFirst({
      orderBy: { name: 'asc' },
      select: { id: true },
    })
    const user = await prisma.user.findFirst({ select: { id: true } })
    if (!cycle || !treatment || !user) {
      throw new Error('Seeded kolam, treatment, and user are required.')
    }
    batchPondId = cycle.id
    treatmentId = treatment.id
    userId = user.id
  })

  afterAll(async () => {
    if (createdIds.length > 0) {
      await prisma.treatmentLog.deleteMany({
        where: { id: { in: createdIds } },
      })
    }
  })

  it('rejects an invalid wall clock', async () => {
    await expect(
      createTreatmentLog(
        {
          batchPondId,
          treatmentId,
          quantityGrams: 10,
          date: '2026-10-02',
          time: '25:00',
          timeZone: 'Asia/Jakarta',
        },
        userId,
      ),
    ).rejects.toBeInstanceOf(KolamError)
  })

  it('rejects quantity below one gram', async () => {
    await expect(
      createTreatmentLog(
        {
          batchPondId,
          treatmentId,
          quantityGrams: 0,
          date: '2026-10-02',
          time: '12:00',
          timeZone: 'Asia/Jakarta',
        },
        userId,
      ),
    ).rejects.toThrow()
  })

  it('lists active rows and blocks update after revoke', async () => {
    await createTreatmentLog(
      {
        batchPondId,
        treatmentId,
        quantityGrams: 42,
        date: '2026-10-02',
        time: '12:00',
        timeZone: 'Asia/Jakarta',
      },
      userId,
    )
    const page = await listKolamTreatments({
      pondCode: 'A3',
      pageIndex: 0,
      pageSize: 100,
      sortId: 'occurredAt',
      sortDesc: true,
    })
    const row = page.rows.find((item) => item.quantityGrams === 42)
    expect(row).toBeDefined()
    if (!row) return
    createdIds.push(row.id)

    await revokeTreatmentLog(row.id, userId)
    const after = await listKolamTreatments({
      pondCode: 'A3',
      pageIndex: 0,
      pageSize: 100,
      sortId: 'occurredAt',
      sortDesc: true,
    })
    expect(after.rows.some((item) => item.id === row.id)).toBe(false)

    await expect(
      updateTreatmentLog({
        id: row.id,
        treatmentId,
        quantityGrams: 50,
        date: '2026-10-02',
        time: '13:00',
        timeZone: 'Asia/Jakarta',
      }),
    ).rejects.toBeInstanceOf(KolamError)
  })

  it('returns treatment master options', async () => {
    const options = await listTreatments()
    expect(options.length).toBeGreaterThan(0)
  })
})
