import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '#/lib/auth-middleware'
import {
  createFastingOverride,
  getKolamLog,
  revokeFastingOverride,
} from '#/features/pakan/api/kolam.server'
import {
  fastingOverrideIdSchema,
  fastingOverrideInputSchema,
  kolamQuerySchema,
} from '#/features/pakan/schemas/kolam'

export const getKolamLogFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .validator(kolamQuerySchema)
  .handler(async ({ data }) => getKolamLog(data))

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
