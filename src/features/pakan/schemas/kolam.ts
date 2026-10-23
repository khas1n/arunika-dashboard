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
export const pondTabSchema = z.enum(['harian', 'puasa', 'treatment', 'grafik'])
export const kolamSearchSchema = z.object({
  tab: pondTabSchema.catch('harian').default('harian'),
})
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

export const kolamChartQuerySchema = z
  .object({
    pondCode: pondCodeSchema,
    from: calendarDateSchema.optional(),
    to: calendarDateSchema.optional(),
  })
  .refine((value) => (value.from == null) === (value.to == null), {
    path: ['to'],
    message: 'Rentang wajib punya awal dan akhir',
  })
  .refine(
    (value) => value.from == null || value.to == null || value.to >= value.from,
    {
      path: ['to'],
      message: 'Hari terakhir tidak boleh sebelum hari pertama',
    },
  )

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

const clockTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Waktu wajib diisi')

const timeZoneSchema = z
  .string()
  .trim()
  .min(1, 'Zona waktu wajib diisi')
  .refine((value) => {
    try {
      Intl.DateTimeFormat('en-US', { timeZone: value }).format(new Date())
      return true
    } catch {
      return false
    }
  }, 'Zona waktu tidak valid')

export const treatmentLogSortSchema = z.enum(['occurredAt'])

export const treatmentLogQuerySchema = pageQuerySchema(
  treatmentLogSortSchema,
)
  .extend({
    pondCode: pondCodeSchema,
    from: calendarDateSchema.optional(),
    to: calendarDateSchema.optional(),
    timeZone: timeZoneSchema.optional(),
  })
  .refine((value) => (value.from == null) === (value.to == null), {
    path: ['to'],
    message: 'Rentang wajib punya awal dan akhir',
  })
  .refine(
    (value) =>
      value.from == null || value.to == null || value.to >= value.from,
    {
      path: ['to'],
      message: 'Hari terakhir tidak boleh sebelum hari pertama',
    },
  )

export const treatmentOptionSchema = z.object({
  id: idSchema,
  code: z.string(),
  name: z.string(),
})

export const treatmentPlanQuerySchema = z.object({
  pondCode: pondCodeSchema,
})

export const treatmentPlanSchema = z.object({
  pondCode: pondCodeSchema,
  treatments: z.array(treatmentOptionSchema),
})

export const treatmentLogInputSchema = z.object({
  batchPondId: idSchema,
  treatmentId: z.string().min(1, 'Pilih treatment'),
  quantityGrams: z
    .number({ error: 'Jumlah wajib diisi' })
    .int('Harus bilangan bulat')
    .min(1, 'Jumlah minimal 1 gram'),
  date: calendarDateSchema,
  time: clockTimeSchema,
  timeZone: timeZoneSchema,
})

export const treatmentLogUpdateSchema = treatmentLogInputSchema
  .omit({ batchPondId: true })
  .extend({ id: idSchema })

export const treatmentLogIdSchema = z.object({ id: idSchema })

export const treatmentLogItemSchema = z.object({
  id: idSchema,
  treatmentId: idSchema,
  treatmentCode: z.string(),
  treatmentName: z.string(),
  quantityGrams: z.number().int(),
  occurredAt: z.string().datetime(),
  userName: z.string(),
})

export const treatmentLogPageSchema = pageSchema(treatmentLogItemSchema)
export const treatmentOptionsSchema = z.array(treatmentOptionSchema)

const dayMeasurementSchema = z
  .number()
  .nonnegative('Tidak boleh negatif')
  .nullable()
const dayCountSchema = z
  .number()
  .int('Harus bilangan bulat')
  .nonnegative('Tidak boleh negatif')

export const pondDayFormSchema = z.object({
  date: calendarDateSchema,
  averageWeightGrams: dayMeasurementSchema,
  deaths: dayCountSchema,
  actualFeedGrams: dayCountSchema,
})

export const pondDayDraftSchema = pondDayFormSchema.omit({ date: true })

const dayTargetSchema = {
  batchPondId: idSchema,
  date: calendarDateSchema,
}

export const pondDayPatchSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('weight'),
    ...dayTargetSchema,
    averageWeightGrams: dayMeasurementSchema,
  }),
  z.object({
    kind: z.literal('deaths'),
    ...dayTargetSchema,
    deaths: dayCountSchema,
  }),
  z.object({
    kind: z.literal('feed'),
    ...dayTargetSchema,
    actualFeedGrams: dayCountSchema,
  }),
  z.object({
    kind: z.literal('day'),
    ...dayTargetSchema,
    averageWeightGrams: dayMeasurementSchema,
    deaths: dayCountSchema,
    actualFeedGrams: dayCountSchema,
  }),
])

export const pondDayLookupSchema = z.object(dayTargetSchema)

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
  fishSpeciesName: z.string(),
  cultivationMethodName: z.string(),
  fcr: z.number().nullable(),
  totalDeaths: z.number().int(),
  cultureStart: calendarDateSchema.nullable(),
  todayWeightGrams: z.number().nullable(),
  todayDeaths: z.number().int().nullable(),
  todayFeedGrams: z.number().int().nullable(),
  /** FR from the latest day that has a weight band. Fractions, shown as percents. */
  latestFrMin: z.number().nullable(),
  latestFrMax: z.number().nullable(),
  latestFrOn: calendarDateSchema.nullable(),
})

export const bibisLineSchema = z.object({
  batchPondId: idSchema,
  pondCode: z.string(),
  prepareOn: calendarDateSchema,
  feedingOn: calendarDateSchema,
  requiredGrams: z.number().nullable(),
  remainingGrams: z.number().nullable(),
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

export const kolamChartPointSchema = z.object({
  date: calendarDateSchema,
  biomassGrams: z.number().nullable(),
  deaths: z.number().int(),
})

export const kolamChartSchema = z.object({
  pondCode: pondCodeSchema,
  points: z.array(kolamChartPointSchema),
})

export type PondListQuery = z.infer<typeof pondListQuerySchema>
export type PondHeaderQuery = z.infer<typeof pondHeaderQuerySchema>
export type BibisQuery = z.infer<typeof bibisQuerySchema>
export type DadakanQuery = z.infer<typeof dadakanQuerySchema>
export type PondDayQuery = z.infer<typeof pondDayQuerySchema>
export type KolamPondLink = z.infer<typeof kolamPondLinkSchema>
export type FastingOverrideInput = z.infer<typeof fastingOverrideInputSchema>
export type PondDayFormValues = z.infer<typeof pondDayFormSchema>
export type PondDayDraft = z.infer<typeof pondDayDraftSchema>
export type PondDayPatch = z.infer<typeof pondDayPatchSchema>
export type PondDaySave = PondDayPatch & { notify?: boolean }
export type PondDayLookup = z.infer<typeof pondDayLookupSchema>
export type PondDay = z.infer<typeof pondDaySchema>
export type KolamCycle = z.infer<typeof kolamCycleSchema>
export type BibisLine = z.infer<typeof bibisLineSchema>
export type FastingOverrideItem = z.infer<typeof fastingOverrideItemSchema>
export type KolamChartQuery = z.infer<typeof kolamChartQuerySchema>
export type KolamChartPoint = z.infer<typeof kolamChartPointSchema>
export type KolamChart = z.infer<typeof kolamChartSchema>
export type TreatmentLogQuery = z.infer<typeof treatmentLogQuerySchema>
export type TreatmentLogInput = z.infer<typeof treatmentLogInputSchema>
export type TreatmentLogUpdate = z.infer<typeof treatmentLogUpdateSchema>
export type TreatmentLogItem = z.infer<typeof treatmentLogItemSchema>
export type TreatmentOption = z.infer<typeof treatmentOptionSchema>
export type TreatmentPlanQuery = z.infer<typeof treatmentPlanQuerySchema>
export type TreatmentPlan = z.infer<typeof treatmentPlanSchema>
export type PondTab = z.infer<typeof pondTabSchema>
export type KolamSearch = z.infer<typeof kolamSearchSchema>
