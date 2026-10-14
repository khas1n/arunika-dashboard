import { z } from 'zod'
import { pageQuerySchema, pageSchema } from '#/lib/page'

/**
 * Shared contract for the Kolam log, today's bibis, and puasa dadakan.
 * The form, the server functions, and the page all use these schemas.
 */

const idSchema = z.string().min(1)
const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi')

const pondCodeSchema = z.string().min(1)

export const pondListSortSchema = z.enum(['batch'])
export const pondHeaderSortSchema = z.enum(['pondCode'])
export const bibisSortSchema = z.enum(['feedingOn'])
export const dadakanSortSchema = z.enum(['status', 'startsOn', 'reason'])
export const pondDaySortSchema = z.enum([
  'date',
  'doc',
  'averageWeightGrams',
  'frMin',
  'frMax',
  'deaths',
  'population',
  'biomassGrams',
  'calculatedFeedGrams',
  'operationalFeedGrams',
  'actualFeedGrams',
  'fastingReason',
])

export const pondListQuerySchema = pageQuerySchema(pondListSortSchema)

export const pondHeaderQuerySchema = pageQuerySchema(
  pondHeaderSortSchema,
).extend({
  pondCode: pondCodeSchema,
})

export const bibisQuerySchema = pageQuerySchema(bibisSortSchema).extend({
  pondCode: pondCodeSchema,
})

export const dadakanQuerySchema = pageQuerySchema(dadakanSortSchema).extend({
  pondCode: pondCodeSchema,
})

export const pondDayQuerySchema = pageQuerySchema(pondDaySortSchema).extend({
  pondCode: pondCodeSchema,
})

export const biomassSeriesQuerySchema = z.object({
  pondCode: pondCodeSchema,
})

export const kolamPondLinkSchema = z.object({
  code: z.string(),
  name: z.string(),
})

export const fastingOverrideInputSchema = z
  .object({
    batchPondId: idSchema,
    startsOn: calendarDateSchema,
    endsOn: calendarDateSchema,
    reason: z
      .string()
      .trim()
      .min(1, 'Alasan wajib diisi')
      .max(200, 'Alasan maksimal 200 karakter'),
    note: z.string().trim().max(500, 'Catatan maksimal 500 karakter'),
  })
  .refine((value) => value.endsOn >= value.startsOn, {
    path: ['endsOn'],
    message: 'Hari terakhir tidak boleh sebelum hari pertama',
  })

export const fastingOverrideIdSchema = z.object({ id: idSchema })

const dayMeasurementSchema = z
  .number()
  .nonnegative('Tidak boleh negatif')
  .nullable()
const dayRateSchema = z
  .number()
  .min(0, 'Tidak boleh negatif')
  .max(1, 'Maksimal 100%')
  .nullable()
const dayCountSchema = z
  .number()
  .int('Harus bilangan bulat')
  .nonnegative('Tidak boleh negatif')

export const pondDayFormSchema = z.object({
  date: calendarDateSchema,
  averageWeightGrams: dayMeasurementSchema,
  frMin: dayRateSchema,
  frMax: dayRateSchema,
  deaths: dayCountSchema,
  actualFeedGrams: dayCountSchema,
})

export const pondDayWriteSchema = pondDayFormSchema.extend({
  batchPondId: idSchema,
  create: z.boolean(),
})

const fastingLabelSchema = z.enum(['pola', 'dadakan']).nullable()

export const pondDaySchema = z.object({
  date: calendarDateSchema.nullable(),
  doc: z.number().int(),
  averageWeightGrams: z.number().nullable(),
  frMin: z.number().nullable(),
  frMax: z.number().nullable(),
  deaths: z.number().int(),
  population: z.number().int().nullable(),
  biomassGrams: z.number().nullable(),
  calculatedFeedGrams: z.number().nullable(),
  operationalFeedGrams: z.number().nullable(),
  actualFeedGrams: z.number().int(),
  fastingReason: fastingLabelSchema,
})

export const kolamCycleSchema = z.object({
  id: idSchema,
  pondCode: z.string(),
  pondName: z.string(),
  seedSource: z.string().nullable(),
  seedCount: z.number().int(),
  volumeM3: z.number().nullable(),
  puasa: z.string().nullable(),
  feedName: z.string().nullable(),
  fcr: z.number().nullable(),
})

export const bibisLineSchema = z.object({
  batchPondId: idSchema,
  pondCode: z.string(),
  prepareOn: calendarDateSchema,
  feedingOn: calendarDateSchema,
  requiredGrams: z.number(),
  remainingGrams: z.number(),
  fastingReason: fastingLabelSchema,
})

export const fastingOverrideItemSchema = z.object({
  id: idSchema,
  startsOn: calendarDateSchema,
  endsOn: calendarDateSchema,
  reason: z.string(),
  note: z.string().nullable(),
  ended: z.boolean(),
})

export const pondListSchema = pageSchema(kolamPondLinkSchema)
export const pondHeaderSchema = pageSchema(kolamCycleSchema)
export const bibisPageSchema = pageSchema(bibisLineSchema)
export const dadakanPageSchema = pageSchema(fastingOverrideItemSchema)
export const pondDayPageSchema = pageSchema(pondDaySchema)

export const biomassPointSchema = z.object({
  date: calendarDateSchema,
  biomassGrams: z.number(),
})

export const biomassSeriesSchema = z.object({
  pondCode: pondCodeSchema,
  points: z.array(biomassPointSchema),
})

export type PondListQuery = z.infer<typeof pondListQuerySchema>
export type PondHeaderQuery = z.infer<typeof pondHeaderQuerySchema>
export type BibisQuery = z.infer<typeof bibisQuerySchema>
export type DadakanQuery = z.infer<typeof dadakanQuerySchema>
export type PondDayQuery = z.infer<typeof pondDayQuerySchema>
export type KolamPondLink = z.infer<typeof kolamPondLinkSchema>
export type FastingOverrideInput = z.infer<typeof fastingOverrideInputSchema>
export type PondDayFormValues = z.infer<typeof pondDayFormSchema>
export type PondDayWrite = z.infer<typeof pondDayWriteSchema>
export type PondDay = z.infer<typeof pondDaySchema>
export type KolamCycle = z.infer<typeof kolamCycleSchema>
export type BibisLine = z.infer<typeof bibisLineSchema>
export type FastingOverrideItem = z.infer<typeof fastingOverrideItemSchema>
export type BiomassSeriesQuery = z.infer<typeof biomassSeriesQuerySchema>
export type BiomassPoint = z.infer<typeof biomassPointSchema>
export type BiomassSeries = z.infer<typeof biomassSeriesSchema>
