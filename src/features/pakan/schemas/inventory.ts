import { z } from 'zod'
import { pageQuerySchema, pageSchema } from '#/lib/page'

/**
 * Contract for centralized feed stock, the bibis forecast, and the activity log.
 * Forms, server functions, and the page share these schemas.
 */

const idSchema = z.string().min(1, 'Pilih jenis pakan')
const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi')
const clockSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Waktu wajib diisi')

const positiveGrams = z
  .number()
  .int('Jumlah harus bilangan bulat gram')
  .positive('Jumlah harus lebih dari 0')

const clientRequestSchema = z.string().uuid('Permintaan tidak valid')

const wallClockSchema = {
  date: calendarDateSchema,
  time: clockSchema,
  timeZone: z.string().min(1, 'Zona waktu wajib diisi'),
}

export const bibisStockStatusSchema = z.enum([
  'aman',
  'perlu-tambah',
  'data-belum-lengkap',
])

export const inventoryActivityTypeSchema = z.enum([
  'receipt',
  'bibis',
  'application',
  'opname',
])

export const receiptInputSchema = z.object({
  feedId: idSchema,
  quantityGrams: positiveGrams,
  note: z.string().trim().max(200).nullable(),
  clientRequestId: clientRequestSchema,
  ...wallClockSchema,
})

export const bibisInputSchema = z.object({
  feedId: idSchema,
  feedingOn: calendarDateSchema,
  quantityGrams: positiveGrams,
  note: z.string().trim().max(200).nullable(),
  clientRequestId: clientRequestSchema,
  ...wallClockSchema,
})

export const opnameInputSchema = z.object({
  feedId: idSchema,
  physicalQuantityGrams: z
    .number()
    .int('Jumlah harus bilangan bulat gram')
    .nonnegative('Jumlah tidak boleh negatif'),
  note: z.string().trim().min(1, 'Alasan koreksi wajib diisi').max(200),
  clientRequestId: clientRequestSchema,
  ...wallClockSchema,
})

const movementStampSchema = z.object({
  quantityGrams: z.number().int(),
  occurredAt: z.coerce.date(),
  note: z.string().nullable(),
})

export const stockRowSchema = z.object({
  feedId: idSchema,
  feedName: z.string(),
  stockGrams: z.number().int(),
  receivedGrams: z.number().int().nonnegative(),
  consumedGrams: z.number().int().nonnegative(),
  adjustmentGrams: z.number().int(),
  lastReceipt: movementStampSchema.nullable(),
})

export const bibisPondLineSchema = z.object({
  batchPondId: idSchema,
  pondCode: z.string(),
  requiredGrams: z.number().int().nullable(),
  fasting: z.boolean(),
  incomplete: z.boolean(),
})

export const bibisRowSchema = z.object({
  feedId: idSchema,
  feedName: z.string(),
  feedingOn: calendarDateSchema.nullable(),
  stockGrams: z.number().int(),
  consumedGrams: z.number().int().nonnegative(),
  requiredGrams: z.number().int().nullable(),
  preparedGrams: z.number().int().nonnegative(),
  remainingGrams: z.number().int().nullable(),
  shortageGrams: z.number().int().nullable(),
  stillToPrepareGrams: z.number().int().nullable(),
  status: bibisStockStatusSchema,
  missingPondCodes: z.array(z.string()),
  ponds: z.array(bibisPondLineSchema),
})

export const inventoryOverviewSchema = z.object({
  prepareOn: calendarDateSchema,
  stocks: z.array(stockRowSchema),
  bibis: z.array(bibisRowSchema),
  unassignedPonds: z.array(bibisPondLineSchema),
})

export const activityRowSchema = z.object({
  id: idSchema,
  sourceId: idSchema,
  type: inventoryActivityTypeSchema,
  occurredAt: z.coerce.date(),
  feedId: idSchema,
  feedName: z.string(),
  quantityGrams: z.number().int(),
  pondCode: z.string().nullable(),
  userName: z.string(),
  note: z.string().nullable(),
})

export const activitySortSchema = z.enum([
  'occurredAt',
  'type',
  'feedName',
  'quantityGrams',
])

/** Values omitted from `/pakan` so a fresh visit stays `/pakan`. */
export const defaultPakanSearch = {
  page: 0,
  pageSize: 10,
  q: '',
  sort: 'occurredAt',
  desc: true,
  type: 'all',
  feed: '',
} as const

export const pakanSearchSchema = z.object({
  page: z.number().int().min(0).optional().catch(undefined),
  pageSize: z.number().int().min(1).max(100).optional().catch(undefined),
  q: z.string().max(60).optional().catch(undefined),
  sort: activitySortSchema.optional().catch(undefined),
  desc: z.boolean().optional().catch(undefined),
  type: inventoryActivityTypeSchema
    .or(z.literal('all'))
    .optional()
    .catch(undefined),
  feed: z.string().optional().catch(undefined),
})

export type PakanSearchParams = z.infer<typeof pakanSearchSchema>

export type PakanSearch = {
  page: number
  pageSize: number
  q: string
  sort: z.infer<typeof activitySortSchema>
  desc: boolean
  type: z.infer<typeof inventoryActivityTypeSchema> | 'all'
  feed: string
}

/** Search params stay absent until the operator changes them. */
export function resolvePakanSearch(search: PakanSearchParams): PakanSearch {
  return {
    page: search.page ?? defaultPakanSearch.page,
    pageSize: search.pageSize ?? defaultPakanSearch.pageSize,
    q: search.q ?? defaultPakanSearch.q,
    sort: search.sort ?? defaultPakanSearch.sort,
    desc: search.desc ?? defaultPakanSearch.desc,
    type: search.type ?? defaultPakanSearch.type,
    feed: search.feed ?? defaultPakanSearch.feed,
  }
}

export const activityQuerySchema = pageQuerySchema(activitySortSchema).extend({
  search: z.string().trim().max(60),
  type: inventoryActivityTypeSchema.or(z.literal('all')),
  feedId: z.string().min(1).nullable(),
  occurredOn: calendarDateSchema.nullable(),
})

export const activityPageSchema = pageSchema(activityRowSchema)

export const inventoryWriteResultSchema = z.object({
  id: idSchema,
  replayed: z.boolean(),
})

export type ReceiptInput = z.infer<typeof receiptInputSchema>
export type BibisInput = z.infer<typeof bibisInputSchema>
export type OpnameInput = z.infer<typeof opnameInputSchema>
export type StockRow = z.infer<typeof stockRowSchema>
export type BibisRow = z.infer<typeof bibisRowSchema>
export type BibisPondLine = z.infer<typeof bibisPondLineSchema>
export type InventoryOverview = z.infer<typeof inventoryOverviewSchema>
export type ActivityRow = z.infer<typeof activityRowSchema>
export type ActivityQuery = z.infer<typeof activityQuerySchema>
export type ActivityPage = z.infer<typeof activityPageSchema>
export type BibisStockStatus = z.infer<typeof bibisStockStatusSchema>
export type InventoryActivityType = z.infer<typeof inventoryActivityTypeSchema>
export type InventoryWriteResult = z.infer<typeof inventoryWriteResultSchema>
