import { redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth } from '#/lib/auth.server'

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const session = await auth.api.getSession({
      headers: getRequestHeaders(),
    })

    if (!session) {
      throw redirect({ to: '/login' })
    }

    return next({
      context: {
        session,
      },
    })
  },
)
