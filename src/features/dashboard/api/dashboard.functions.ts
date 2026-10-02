import { createServerFn } from '@tanstack/react-start'
import { authMiddleware } from '#/lib/auth-middleware'
import { getDashboardSummary } from '#/features/dashboard/api/dashboard.server'

export const getDashboardSummaryFn = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async () => getDashboardSummary())
