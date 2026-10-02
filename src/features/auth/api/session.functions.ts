import { createServerFn } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth.server'
import type { CurrentSession } from '#/features/auth/api/session'

export const getSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<CurrentSession | null> => {
    const session = await auth.api.getSession({
      headers: getRequestHeaders(),
    })

    if (!session) return null

    return {
      user: {
        id: session.user.id,
        name: session.user.name,
        username: session.user.username ?? '',
        email: session.user.email,
        image: session.user.image ?? null,
        createdAt: session.user.createdAt.toISOString(),
      },
      session: {
        id: session.session.id,
        expiresAt: session.session.expiresAt.toISOString(),
        ipAddress: session.session.ipAddress ?? null,
        userAgent: session.session.userAgent ?? null,
      },
    }
  },
)
