import 'dotenv/config'
import { existsSync } from 'node:fs'
import { PrismaPg } from '@prisma/adapter-pg'
import ExcelJS from 'exceljs'

import { jakartaDayStart } from '../src/features/pakan/domain/feeding-schedule.ts'
import { PrismaClient } from '../src/generated/prisma/client.js'

/**
 * Loads BATCH 1 from the workbook into the existing schema.
 *
 * Actual feed is only a typed column T on that pond's sheet. Column I is
 * recommended feed and is never stored. Puasa dadakan is not in the workbook,
 * so this script writes no FastingOverride rows. Re-running replaces the
 * BATCH 1 cycles and keeps ponds, feeds, species, methods, and the admin user.
 * Every recreated cycle is Nila grown with Biofloc, the only rows this farm
 * has today. Those rows are master data, looked up by code.
 */

const BATCH_NAME = 'BATCH 1'
const POND_ORDER = ['A3', 'B3', 'C3', 'D3', 'A6', 'B6', 'C6', 'D6'] as const
const VOLUME_OVERRIDE: Partial<Record<PondCode, number>> = {
  A6: 28,
  B6: 28,
  C6: 28,
  D6: 28,
}
const SEED_COUNT_OVERRIDE: Partial<Record<PondCode, number>> = { D3: 1451 }
const PUASA_OVERRIDE: Partial<Record<PondCode, string>> = { D3: '6:1' }

const TREATMENTS = [
  { code: 'MOLASE', name: 'Molase' },
  { code: 'GOS_STRONG', name: 'Gos Strong' },
  { code: 'AQUA_CELL', name: 'Aqua Cell' },
  { code: 'BASILUS', name: 'Basilus' },
] as const

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
}

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is required')

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
})

type PondCode = (typeof POND_ORDER)[number]

interface Band {
  minWeightGrams: number
  maxWeightGrams: number
  frMin: number
  frMax: number
}

interface ParsedDay {
  date: string | null
  doc: number
  weight: number | null
  deaths: number | null
  molase: number | null
  floc: number | null
  ph: number | null
  tds: number | null
  dissolvedOxygen: number | null
  temperatureC: number | null
  actualFeed: number | null
  frMin: number | null
  frMax: number | null
}

interface ParsedPond {
  code: PondCode
  name: string
  stockingDate: string | null
  seedSource: string | null
  feedName: string
  seedCount: number | null
  volumeM3: number
  puasa: { feed: number; fast: number } | null
  plannedSeedCount: number | null
  plannedPuasa: { feed: number; fast: number } | null
  densityPerM3: number | null
  aeratorType: string | null
  probiotic: string | null
  molase: boolean
  basilus: boolean
  protein: number | null
  carbon: number | null
  nitrogen: number | null
  notes: string | null
  recommendedFeedGrams: number | null
  days: ParsedDay[]
  typedFeedCount: number
  typedFeedGrams: number
}

function fail(message: string): never {
  throw new Error(message)
}

function workbookPath(): string {
  const candidates = [
    'reference/Copy of Manajement Pakan - BATCH 1.xlsx',
    'Copy of Manajement Pakan - BATCH 1.xlsx',
  ]
  const found = candidates.find((path) => existsSync(path))
  if (!found) fail(`Workbook not found. Looked for ${candidates.join(', ')}`)
  return found
}

function isFormula(value: ExcelJS.CellValue): boolean {
  return (
    value != null &&
    typeof value === 'object' &&
    ('formula' in value || 'sharedFormula' in value)
  )
}

function typedScalar(
  value: ExcelJS.CellValue,
): string | number | boolean | Date | null {
  if (value == null || value === '') return null
  if (isFormula(value)) return null
  if (value instanceof Date) return value
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value
  }
  if (typeof value === 'object' && 'richText' in value) {
    return value.richText.map((part) => part.text).join('')
  }
  return null
}

function formulaNumber(value: ExcelJS.CellValue): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (value != null && typeof value === 'object' && 'result' in value) {
    const result = value.result
    if (typeof result === 'number' && Number.isFinite(result)) return result
  }
  return null
}

function typedNumber(value: ExcelJS.CellValue): number | null {
  const typed = typedScalar(value)
  if (typeof typed === 'number' && Number.isFinite(typed)) return typed
  if (typeof typed === 'string' && typed.trim() !== '') {
    const parsed = Number(typed)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function typedText(value: ExcelJS.CellValue): string | null {
  const typed = typedScalar(value)
  if (typeof typed === 'string') {
    const text = typed.trim()
    return text === '' ? null : text
  }
  if (typeof typed === 'number' && Number.isFinite(typed)) return String(typed)
  return null
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function calendarFromUtc(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

function typedCalendarDate(value: ExcelJS.CellValue): string | null {
  const typed = typedScalar(value)
  if (typed instanceof Date) return calendarFromUtc(typed)
  if (typeof typed === 'number' && typed > 20_000 && typed < 80_000) {
    return calendarFromUtc(
      new Date(Date.UTC(1899, 11, 30) + typed * 86_400_000),
    )
  }
  if (typeof typed !== 'string') return null
  const match = typed.trim().match(/^(\d{1,2})-([A-Za-z]+)-(\d{2,4})$/)
  if (!match) return null
  const month = MONTHS[match[2].toLowerCase()]
  if (!month) fail(`Bulan tidak dikenal: ${typed}`)
  const year = Number(match[3])
  const fullYear = year < 100 ? 2000 + year : year
  return `${fullYear}-${pad(month)}-${pad(Number(match[1]))}`
}

function parsePuasa(
  value: string,
  label: string,
): { feed: number; fast: number } {
  const match = value.trim().match(/^(\d+)\s*:\s*(\d+)$/)
  if (!match) fail(`Puasa tidak dikenal pada ${label}: ${value}`)
  const feed = Number(match[1])
  const fast = Number(match[2])
  if (feed < 1 || fast < 0) fail(`Puasa tidak valid pada ${label}: ${value}`)
  return { feed, fast }
}

function decimalString(value: number, scale: number): string {
  const fixed = value.toFixed(scale)
  if (!fixed.includes('.')) return fixed
  return fixed.replace(/0+$/, '').replace(/\.$/, '')
}

function positiveInt(value: number | null): number | null {
  if (value == null || value <= 0) return null
  return Math.floor(value + 0.5)
}

function utcDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`)
}

function fraction(value: number): number {
  return value > 1 ? value / 100 : value
}

function findBand(weight: number, bands: readonly Band[]): Band | null {
  let found: Band | null = null
  for (const band of bands) {
    if (
      band.minWeightGrams <= weight &&
      (found == null || band.minWeightGrams > found.minWeightGrams)
    ) {
      found = band
    }
  }
  return found
}

function sheetByCode(
  workbook: ExcelJS.Workbook,
  code: string,
): ExcelJS.Worksheet {
  const sheet = workbook.worksheets.find(
    (item) => item.name.match(/([A-D][36])/)?.[1] === code,
  )
  if (!sheet) fail(`Sheet kolam ${code} tidak ada`)
  return sheet
}

function konfigurasiColumn(sheet: ExcelJS.Worksheet, code: PondCode): number {
  for (let column = 3; column <= 10; column += 1) {
    const header = typedText(sheet.getCell(4, column).value) ?? ''
    if (header.startsWith(code)) return column
  }
  return fail(`Kolom Konfigurasi untuk ${code} tidak ada`)
}

function readBands(sheet: ExcelJS.Worksheet): Band[] {
  const bands: Band[] = []
  for (let row = 5; row <= 11; row += 1) {
    const min = typedNumber(sheet.getCell(row, 3).value)
    const max = typedNumber(sheet.getCell(row, 4).value)
    const frMin = typedNumber(sheet.getCell(row, 5).value)
    const frMax = typedNumber(sheet.getCell(row, 6).value)
    if (min == null || max == null || frMin == null || frMax == null) {
      fail(`Band Referensi baris ${row} tidak lengkap`)
    }
    bands.push({
      minWeightGrams: min,
      maxWeightGrams: max,
      frMin: fraction(frMin),
      frMax: fraction(frMax),
    })
  }
  return bands
}

function readAdditives(
  sheet: ExcelJS.Worksheet,
): Array<{ name: string; gramsPerFeedGram: number }> {
  const per = typedNumber(sheet.getCell(3, 10).value)
  if (per == null || per <= 0) fail('Jumlah pakan pada Referensi tidak ada')
  const additives: Array<{ name: string; gramsPerFeedGram: number }> = []
  for (let row = 4; row <= 7; row += 1) {
    const name = typedText(sheet.getCell(row, 9).value)
    const grams = formulaNumber(sheet.getCell(row, 10).value)
    if (!name || grams == null)
      fail(`Aditif Referensi baris ${row} tidak lengkap`)
    additives.push({ name, gramsPerFeedGram: grams / per })
  }
  return additives
}

function readDay(
  sheet: ExcelJS.Worksheet,
  row: number,
  bands: readonly Band[],
): ParsedDay | null {
  const weight = typedNumber(sheet.getCell(row, 3).value)
  const deaths = typedNumber(sheet.getCell(row, 6).value)
  const molase = typedNumber(sheet.getCell(row, 12).value)
  const floc = typedNumber(sheet.getCell(row, 15).value)
  const ph = typedNumber(sheet.getCell(row, 16).value)
  const tds = typedNumber(sheet.getCell(row, 17).value)
  const dissolvedOxygen = typedNumber(sheet.getCell(row, 18).value)
  const temperatureC = typedNumber(sheet.getCell(row, 19).value)
  const actualFeed = typedNumber(sheet.getCell(row, 20).value)
  const typed = [
    weight,
    deaths,
    molase,
    floc,
    ph,
    tds,
    dissolvedOxygen,
    temperatureC,
    actualFeed,
  ].some((value) => value != null)
  if (!typed) return null

  const doc = typedNumber(sheet.getCell(row, 2).value)
  if (doc == null || doc < 1) fail(`${sheet.name} baris ${row} tidak punya DOC`)
  const band = weight == null || weight <= 0 ? null : findBand(weight, bands)
  return {
    date: typedCalendarDate(sheet.getCell(row, 1).value),
    doc: Math.floor(doc),
    weight,
    deaths,
    molase,
    floc,
    ph,
    tds,
    dissolvedOxygen,
    temperatureC,
    actualFeed,
    frMin: band ? band.frMin : null,
    frMax: band ? band.frMax : null,
  }
}

function readPond(
  workbook: ExcelJS.Workbook,
  code: PondCode,
  bands: readonly Band[],
  plan: ExcelJS.Worksheet,
): ParsedPond {
  const sheet = sheetByCode(workbook, code)
  const column = konfigurasiColumn(plan, code)
  const stockingDate = typedCalendarDate(sheet.getCell(2, 7).value)
  const sheetPuasa = typedText(sheet.getCell(4, 14).value)
  const planPuasa = typedText(plan.getCell(13, column).value)
  const puasaText = PUASA_OVERRIDE[code] ?? sheetPuasa
  const seedCount =
    SEED_COUNT_OVERRIDE[code] ?? typedNumber(sheet.getCell(4, 4).value)
  const sheetVolume = typedNumber(sheet.getCell(8, 4).value)
  const planVolume = formulaNumber(plan.getCell(9, column).value)
  const volumeM3 = VOLUME_OVERRIDE[code] ?? sheetVolume ?? planVolume
  if (volumeM3 == null) fail(`${code} tidak punya volume`)
  const feedName = typedText(sheet.getCell(2, 14).value)
  if (!feedName) fail(`${code} tidak punya pakan`)
  const probiotic = typedText(plan.getCell(15, column).value)

  const days: ParsedDay[] = []
  for (let row = 13; row <= sheet.rowCount; row += 1) {
    const day = readDay(sheet, row, bands)
    if (day) days.push(day)
  }
  const feedDays = days.filter(
    (day) => day.actualFeed != null && day.actualFeed > 0,
  )

  return {
    code,
    name: typedText(plan.getCell(4, column).value) ?? code,
    stockingDate,
    seedSource: typedText(sheet.getCell(2, 10).value),
    feedName,
    seedCount,
    volumeM3,
    puasa: stockingDate && puasaText ? parsePuasa(puasaText, code) : null,
    plannedSeedCount: formulaNumber(plan.getCell(10, column).value),
    plannedPuasa: planPuasa
      ? parsePuasa(planPuasa, `Konfigurasi ${code}`)
      : null,
    densityPerM3: formulaNumber(plan.getCell(8, column).value),
    aeratorType: typedText(plan.getCell(5, column).value),
    probiotic: probiotic === '-' ? null : probiotic,
    molase:
      (typedText(plan.getCell(6, column).value) ?? '').toLowerCase() === 'yes',
    basilus:
      (typedText(plan.getCell(7, column).value) ?? '').toLowerCase() === 'yes',
    protein: typedNumber(sheet.getCell(4, 10).value),
    carbon: typedNumber(sheet.getCell(5, 10).value),
    nitrogen: typedNumber(sheet.getCell(6, 10).value),
    notes: typedText(sheet.getCell(7, 13).value),
    recommendedFeedGrams: formulaNumber(sheet.getCell(5, 7).value),
    days,
    typedFeedCount: feedDays.length,
    typedFeedGrams: feedDays.reduce(
      (sum, day) => sum + (day.actualFeed ?? 0),
      0,
    ),
  }
}

async function main() {
  const username = (process.env.SEED_ADMIN_USERNAME ?? 'admin')
    .trim()
    .toLowerCase()
  const admin = await prisma.user.findUnique({ where: { username } })
  if (!admin) {
    fail(`Pengguna admin "${username}" tidak ada. Jalankan db:seed lebih dulu.`)
  }

  const workbook = new ExcelJS.Workbook()
  const path = workbookPath()
  await workbook.xlsx.readFile(path)
  const referensi =
    workbook.getWorksheet('Referensi') ?? fail('Sheet Referensi tidak ada')
  const plan =
    workbook.getWorksheet('Konfigurasi') ?? fail('Sheet Konfigurasi tidak ada')
  const bands = readBands(referensi)
  const additives = readAdditives(referensi)
  const ponds = POND_ORDER.map((code) => readPond(workbook, code, bands, plan))
  const seedWeight = formulaNumber(plan.getCell(11, 3).value)

  const a3 = ponds.find((pond) => pond.code === 'A3')
  if (!a3) fail('A3 tidak ada')
  if (a3.typedFeedGrams === a3.recommendedFeedGrams) {
    fail(
      'Total pakan aktual A3 sama dengan pakan rekomendasi. Kolom I ikut tersimpan.',
    )
  }
  const c6 = ponds.find((pond) => pond.code === 'C6')
  if (!c6 || c6.carbon !== 0.35) fail('Carbon C6 harus 0.35 dari sheet')

  await prisma.$transaction(
    async (tx) => {
      for (const band of bands) {
        await tx.feedingRateBand.upsert({
          where: { minWeightGrams: decimalString(band.minWeightGrams, 3) },
          update: {
            maxWeightGrams: decimalString(band.maxWeightGrams, 3),
            frMin: decimalString(band.frMin, 4),
            frMax: decimalString(band.frMax, 4),
          },
          create: {
            minWeightGrams: decimalString(band.minWeightGrams, 3),
            maxWeightGrams: decimalString(band.maxWeightGrams, 3),
            frMin: decimalString(band.frMin, 4),
            frMax: decimalString(band.frMax, 4),
          },
        })
      }

      for (const additive of additives) {
        await tx.feedAdditive.upsert({
          where: { name: additive.name },
          update: {
            gramsPerFeedGram: decimalString(additive.gramsPerFeedGram, 6),
          },
          create: {
            name: additive.name,
            gramsPerFeedGram: decimalString(additive.gramsPerFeedGram, 6),
          },
        })
      }

      for (const treatment of TREATMENTS) {
        await tx.treatment.upsert({
          where: { code: treatment.code },
          update: { name: treatment.name },
          create: treatment,
        })
      }
      const treatmentIds = new Map(
        (
          await tx.treatment.findMany({
            where: { code: { in: TREATMENTS.map((item) => item.code) } },
          })
        ).map((treatment) => [treatment.code, treatment.id]),
      )

      const feedIds = new Map<string, string>()
      for (const name of new Set(ponds.map((pond) => pond.feedName))) {
        const feed = await tx.feed.upsert({
          where: { name },
          update: {},
          create: { name },
        })
        feedIds.set(name, feed.id)
      }

      const sourceIds = new Map<string, string>()
      for (const name of new Set(
        ponds.flatMap((pond) => (pond.seedSource ? [pond.seedSource] : [])),
      )) {
        const source = await tx.seedSource.upsert({
          where: { name },
          update: {},
          create: { name },
        })
        sourceIds.set(name, source.id)
      }

      const pondIds = new Map<string, string>()
      for (const pond of ponds) {
        const row = await tx.pond.upsert({
          where: { code: pond.code },
          update: { name: pond.name },
          create: { code: pond.code, name: pond.name },
        })
        pondIds.set(pond.code, row.id)
      }

      const batch = await tx.batch.upsert({
        where: { name: BATCH_NAME },
        update: {
          molassesCarbonFraction: '0.37',
          plannedSeedWeightGrams:
            seedWeight == null ? null : decimalString(seedWeight, 8),
          bibisLeadDays: 2,
        },
        create: {
          name: BATCH_NAME,
          molassesCarbonFraction: '0.37',
          plannedSeedWeightGrams:
            seedWeight == null ? null : decimalString(seedWeight, 8),
          bibisLeadDays: 2,
        },
      })

      const existing = await tx.batchPond.findMany({
        where: { batchId: batch.id },
        select: { id: true },
      })
      const existingIds = existing.map((row) => row.id)
      if (existingIds.length > 0) {
        await tx.feedApplication.deleteMany({
          where: { batchPondId: { in: existingIds } },
        })
        await tx.treatmentLog.deleteMany({
          where: { batchPondId: { in: existingIds } },
        })
        await tx.mortalityEvent.deleteMany({
          where: { batchPondId: { in: existingIds } },
        })
        await tx.bibisRecord.deleteMany({
          where: { batchPondId: { in: existingIds } },
        })
        await tx.pondStocking.deleteMany({
          where: { batchPondId: { in: existingIds } },
        })
        await tx.pondDailyRecord.deleteMany({
          where: { batchPondId: { in: existingIds } },
        })
        await tx.fastingOverride.deleteMany({
          where: { batchPondId: { in: existingIds } },
        })
        await tx.pondFastingPattern.deleteMany({
          where: { batchPondId: { in: existingIds } },
        })
        await tx.batchPondTreatment.deleteMany({
          where: { batchPondId: { in: existingIds } },
        })
        await tx.batchPond.deleteMany({ where: { id: { in: existingIds } } })
      }

      const molaseId =
        treatmentIds.get('MOLASE') ?? fail('Treatment MOLASE tidak ada')
      const basilusId =
        treatmentIds.get('BASILUS') ?? fail('Treatment BASILUS tidak ada')
      const species = await tx.fishSpecies.upsert({
        where: { code: 'NILA' },
        update: {
          name: 'Nila',
          scientificName: 'Oreochromis niloticus',
          active: true,
        },
        create: {
          code: 'NILA',
          name: 'Nila',
          scientificName: 'Oreochromis niloticus',
        },
      })
      const method = await tx.cultivationMethod.upsert({
        where: { code: 'BIOFLOC' },
        update: { name: 'Biofloc', active: true },
        create: { code: 'BIOFLOC', name: 'Biofloc' },
      })

      for (const pond of ponds) {
        const feedId =
          feedIds.get(pond.feedName) ?? fail(`Pakan ${pond.feedName} tidak ada`)
        const created = await tx.batchPond.create({
          data: {
            batchId: batch.id,
            pondId:
              pondIds.get(pond.code) ?? fail(`Kolam ${pond.code} tidak ada`),
            feedId,
            fishSpeciesId: species.id,
            cultivationMethodId: method.id,
            plannedSeedCount: pond.plannedSeedCount,
            volumeM3: decimalString(pond.volumeM3, 2),
            plannedFeedDayCount: pond.plannedPuasa?.feed ?? null,
            plannedFastDayCount: pond.plannedPuasa?.fast ?? null,
            densityPerM3:
              pond.densityPerM3 == null
                ? null
                : decimalString(pond.densityPerM3, 2),
            aeratorType: pond.aeratorType,
            probiotic: pond.probiotic,
            proteinFraction:
              pond.protein == null ? null : decimalString(pond.protein, 4),
            carbonFraction:
              pond.carbon == null ? null : decimalString(pond.carbon, 4),
            nitrogenFraction:
              pond.nitrogen == null ? null : decimalString(pond.nitrogen, 4),
            notes: pond.notes,
          },
        })

        const treatmentLinks = [
          pond.molase ? molaseId : null,
          pond.basilus ? basilusId : null,
        ].filter((id): id is string => id != null)
        if (treatmentLinks.length > 0) {
          await tx.batchPondTreatment.createMany({
            data: treatmentLinks.map((treatmentId) => ({
              batchPondId: created.id,
              treatmentId,
            })),
          })
        }

        if (pond.stockingDate && pond.puasa) {
          await tx.pondFastingPattern.create({
            data: {
              batchPondId: created.id,
              feedDayCount: pond.puasa.feed,
              fastDayCount: pond.puasa.fast,
              anchorOn: utcDate(pond.stockingDate),
              effectiveFrom: utcDate(pond.stockingDate),
            },
          })
        }

        if (pond.stockingDate && pond.seedCount != null && pond.seedCount > 0) {
          const sourceName = pond.seedSource
          if (!sourceName)
            fail(`${pond.code} punya tanggal tebar tanpa asal bibit`)
          await tx.pondStocking.create({
            data: {
              batchPondId: created.id,
              seedSourceId:
                sourceIds.get(sourceName) ??
                fail(`Asal bibit ${sourceName} tidak ada`),
              quantity: Math.floor(pond.seedCount),
              occurredOn: utcDate(pond.stockingDate),
              userId: admin.id,
            },
          })
        }

        for (const day of pond.days) {
          await tx.pondDailyRecord.create({
            data: {
              batchPondId: created.id,
              doc: day.doc,
              observedOn: day.date ? utcDate(day.date) : null,
              averageWeightGrams:
                day.weight == null ? null : decimalString(day.weight, 3),
              frMin: day.frMin == null ? null : decimalString(day.frMin, 4),
              frMax: day.frMax == null ? null : decimalString(day.frMax, 4),
              floc: day.floc == null ? null : decimalString(day.floc, 2),
              ph: day.ph == null ? null : decimalString(day.ph, 2),
              tds: day.tds == null ? null : decimalString(day.tds, 2),
              dissolvedOxygen:
                day.dissolvedOxygen == null
                  ? null
                  : decimalString(day.dissolvedOxygen, 2),
              temperatureC:
                day.temperatureC == null
                  ? null
                  : decimalString(day.temperatureC, 2),
            },
          })

          if (!day.date) {
            const hasEvent =
              positiveInt(day.deaths) != null ||
              positiveInt(day.molase) != null ||
              positiveInt(day.actualFeed) != null
            if (hasEvent)
              fail(`${pond.code} DOC ${day.doc} punya kejadian tanpa tanggal`)
            continue
          }

          const occurredAt = jakartaDayStart(day.date)
          const deaths = positiveInt(day.deaths)
          if (deaths != null) {
            await tx.mortalityEvent.create({
              data: {
                batchPondId: created.id,
                quantity: deaths,
                occurredAt,
                userId: admin.id,
              },
            })
          }
          const molase = positiveInt(day.molase)
          if (molase != null) {
            await tx.treatmentLog.create({
              data: {
                batchPondId: created.id,
                treatmentId: molaseId,
                quantityGrams: molase,
                occurredAt,
                userId: admin.id,
              },
            })
          }
          const actual = positiveInt(day.actualFeed)
          if (actual != null) {
            await tx.feedApplication.create({
              data: {
                batchPondId: created.id,
                feedId,
                quantityGrams: actual,
                occurredAt,
                userId: admin.id,
              },
            })
          }
        }
      }

      const stored = await tx.batchPond.findMany({
        where: { batchId: batch.id },
        include: {
          pond: true,
          stockings: true,
          fastingPatterns: true,
          feedApplications: true,
          mortalityEvents: true,
          treatmentLogs: true,
          dailyRecords: true,
          fastingOverrides: true,
        },
      })

      for (const pond of ponds) {
        const row = stored.find((item) => item.pond.code === pond.code)
        if (!row) fail(`${pond.code} tidak tersimpan`)
        const feedGrams = row.feedApplications.reduce(
          (sum, item) => sum + item.quantityGrams,
          0,
        )
        if (row.feedApplications.length !== pond.typedFeedCount) {
          fail(
            `${pond.code} jumlah pakan aktual ${row.feedApplications.length} tidak sama dengan sel T ${pond.typedFeedCount}`,
          )
        }
        if (feedGrams !== positiveFeedSum(pond)) {
          fail(
            `${pond.code} total pakan aktual ${feedGrams} tidak sama dengan jumlah sel T ${positiveFeedSum(pond)}`,
          )
        }
        if (row.fastingOverrides.length !== 0) {
          fail(`${pond.code} punya puasa dadakan dari impor`)
        }
        console.log(
          [
            pond.code,
            `hari=${row.dailyRecords.length}`,
            `mati=${row.mortalityEvents.length}`,
            `molase=${row.treatmentLogs.length}`,
            `pakan=${row.feedApplications.length}`,
            `gram=${feedGrams}`,
            `tebar=${row.stockings.reduce((sum, item) => sum + item.quantity, 0)}`,
            `volume=${row.volumeM3}`,
            `puasa=${row.fastingPatterns.map((item) => `${item.feedDayCount}:${item.fastDayCount}`).join(',') || '-'}`,
            `carbon=${row.carbonFraction}`,
          ].join(' '),
        )
      }

      const storedD3 = stored.find((item) => item.pond.code === 'D3')
      const storedA6 = stored.find((item) => item.pond.code === 'A6')
      const storedC6 = stored.find((item) => item.pond.code === 'C6')
      const storedD6 = stored.find((item) => item.pond.code === 'D6')
      const storedA3 = stored.find((item) => item.pond.code === 'A3')
      if (!storedD3 || storedD3.stockings[0]?.quantity !== 1451) {
        fail('D3 harus ditebar 1451')
      }
      if (
        storedD3.fastingPatterns[0]?.feedDayCount !== 6 ||
        storedD3.fastingPatterns[0]?.fastDayCount !== 1
      ) {
        fail('Puasa D3 harus 6:1')
      }
      if (!storedA6 || Number(storedA6.volumeM3) !== 28)
        fail('Volume A6 harus 28')
      if (!storedC6 || Number(storedC6.volumeM3) !== 28)
        fail('Volume C6 harus 28')
      if (!storedD6 || Number(storedD6.volumeM3) !== 28)
        fail('Volume D6 harus 28')
      if (
        storedC6.stockings.length !== 0 ||
        storedC6.fastingPatterns.length !== 0
      ) {
        fail(
          'C6 tidak punya tanggal tebar, jadi tidak boleh ada tebar atau pola puasa',
        )
      }
      if (
        storedD6.stockings.length !== 0 ||
        storedD6.fastingPatterns.length !== 0
      ) {
        fail(
          'D6 tidak punya tanggal tebar, jadi tidak boleh ada tebar atau pola puasa',
        )
      }
      if (!storedA3 || storedA3.feedApplications.length !== 0) {
        fail('A3 tidak boleh punya pakan aktual')
      }
      if (Number(storedC6.carbonFraction) !== 0.35)
        fail('Carbon C6 tersimpan bukan 0.35')

      const vitamin = await tx.feedAdditive.findUnique({
        where: { name: 'Vitamin C' },
      })
      if (!vitamin || Number(vitamin.gramsPerFeedGram) !== 0.0001) {
        fail('Vitamin C harus 0.0001 g per g pakan dari Referensi')
      }
    },
    { timeout: 60_000 },
  )

  console.log(`Impor ${BATCH_NAME} dari ${path} selesai.`)
}

function positiveFeedSum(pond: ParsedPond): number {
  return pond.days.reduce(
    (sum, day) => sum + (positiveInt(day.actualFeed) ?? 0),
    0,
  )
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error: unknown) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
