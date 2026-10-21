import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  createTreatmentLog,
  KolamError,
  listKolamTreatments,
  listTreatments,
  revokeTreatmentLog,
  updateTreatmentLog,
} from '#/features/pakan/api/kolam.server'
import { prisma } from '#/lib/db.server'

const hasDb = Boolean(process.env.DATABASE_URL)

describe.skipIf(!hasDb)('treatment log server', () => {
  let batchPondId = ''
  let treatmentId = ''
  let userId = ''
  const createdIds: Array<string> = []

  beforeAll(async () => {
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
