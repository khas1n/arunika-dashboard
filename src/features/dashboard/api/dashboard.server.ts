import { prisma } from '#/lib/db.server'

export async function getDashboardSummary() {
  const [userCount, sessionCount] = await Promise.all([
    prisma.user.count(),
    prisma.session.count({
      where: { expiresAt: { gt: new Date() } },
    }),
  ])

  return { userCount, sessionCount }
}
