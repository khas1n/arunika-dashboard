import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '#/lib/auth-middleware'
import {
  createFastingOverride,
  getKolamHeader,
  listKolamBibis,
  listKolamBiomass,
  listKolamDays,
  listKolamOverrides,
  listKolamPonds,
  revokeFastingOverride,
  upsertPondDay,
} from '#/features/pakan/api/kolam.server'
import {
  bibisQuerySchema,
  biomassSeriesQuerySchema,
  dadakanQuerySchema,
  fastingOverrideIdSchema,
  fastingOverrideInputSchema,
  pondDayQuerySchema,
  pondDayWriteSchema,
  pondHeaderQuerySchema,
  pondListQuerySchema,
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

export const listKolamBiomassFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(biomassSeriesQuerySchema)
  .handler(async ({ data }) => listKolamBiomass(data.pondCode))

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

export const upsertPondDayFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator(pondDayWriteSchema)
  .handler(async ({ data, context }) =>
    upsertPondDay(data, context.session.user.id),
  )
