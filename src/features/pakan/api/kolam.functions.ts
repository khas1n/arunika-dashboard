import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '#/lib/auth-middleware'
import {
  createFastingOverride,
  createTreatmentLog,
  getKolamHeader,
  getKolamTreatmentPlan,
  listKolamBibis,
  listKolamChart,
  listKolamDays,
  listKolamOverrides,
  listKolamPonds,
  listKolamTreatments,
  listTreatments,
  pondDayDraft,
  pondDayExists,
  revokeFastingOverride,
  revokeTreatmentLog,
  updateTreatmentLog,
  upsertPondDay,
} from '#/features/pakan/api/kolam.server'
import {
  bibisQuerySchema,
  kolamChartQuerySchema,
  dadakanQuerySchema,
  fastingOverrideIdSchema,
  fastingOverrideInputSchema,
  pondDayLookupSchema,
  pondDayPatchSchema,
  pondDayQuerySchema,
  pondHeaderQuerySchema,
  pondListQuerySchema,
  treatmentLogIdSchema,
  treatmentLogInputSchema,
  treatmentLogQuerySchema,
  treatmentLogUpdateSchema,
  treatmentPlanQuerySchema,
} from '#/features/pakan/schemas/kolam'

export const listKolamPondsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(pondListQuerySchema)
  .handler(async ({ data }) => listKolamPonds(data))

export const getKolamHeaderFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(pondHeaderQuerySchema)
  .handler(async ({ data }) => getKolamHeader(data))

export const listKolamBibisFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(bibisQuerySchema)
  .handler(async ({ data }) => listKolamBibis(data))

export const listKolamChartFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(kolamChartQuerySchema)
  .handler(async ({ data }) => listKolamChart(data))

export const listKolamDaysFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(pondDayQuerySchema)
  .handler(async ({ data }) => listKolamDays(data))

export const listKolamOverridesFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(dadakanQuerySchema)
  .handler(async ({ data }) => listKolamOverrides(data))

export const createFastingOverrideFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(fastingOverrideInputSchema)
  .handler(async ({ data, context }) =>
    createFastingOverride(data, context.session.user.id),
  )

export const revokeFastingOverrideFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(fastingOverrideIdSchema)
  .handler(async ({ data, context }) =>
    revokeFastingOverride(data.id, context.session.user.id),
  )

export const pondDayDraftFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(pondDayLookupSchema)
  .handler(async ({ data }) => pondDayDraft(data))

export const pondDayExistsFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(pondDayLookupSchema)
  .handler(async ({ data }) => pondDayExists(data))

export const upsertPondDayFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(pondDayPatchSchema)
  .handler(async ({ data, context }) =>
    upsertPondDay(data, context.session.user.id),
  )

export const listTreatmentsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => listTreatments())

export const getKolamTreatmentPlanFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(treatmentPlanQuerySchema)
  .handler(async ({ data }) => getKolamTreatmentPlan(data))

export const listKolamTreatmentsFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(treatmentLogQuerySchema)
  .handler(async ({ data }) => listKolamTreatments(data))

export const createTreatmentLogFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(treatmentLogInputSchema)
  .handler(async ({ data, context }) =>
    createTreatmentLog(data, context.session.user.id),
  )

export const updateTreatmentLogFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(treatmentLogUpdateSchema)
  .handler(async ({ data }) => updateTreatmentLog(data))

export const revokeTreatmentLogFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(treatmentLogIdSchema)
  .handler(async ({ data, context }) =>
    revokeTreatmentLog(data.id, context.session.user.id),
  )
