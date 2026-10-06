import { z } from 'zod'

/**
 * Shared contract for the Kolam log, today's bibis, and puasa dadakan.
 * The form, the server functions, and the page all use these schemas.
 */

const idSchema = z.string().min(1)
const calendarDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal wajib diisi')

export const kolamQuerySchema = z.object({
  batchPondId: idSchema.optional(),
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
})

export const kolamLogSchema = z.object({
  prepareOn: calendarDateSchema,
  feedingOn: calendarDateSchema,
  cycles: z.array(kolamCycleSchema),
  selectedId: idSchema.nullable(),
  days: z.array(pondDaySchema),
  bibis: z.array(bibisLineSchema),
  overrides: z.array(fastingOverrideItemSchema),
})

export type KolamQuery = z.infer<typeof kolamQuerySchema>
export type FastingOverrideInput = z.infer<typeof fastingOverrideInputSchema>
export type PondDay = z.infer<typeof pondDaySchema>
export type KolamCycle = z.infer<typeof kolamCycleSchema>
export type BibisLine = z.infer<typeof bibisLineSchema>
export type FastingOverrideItem = z.infer<typeof fastingOverrideItemSchema>
export type KolamLog = z.infer<typeof kolamLogSchema>
