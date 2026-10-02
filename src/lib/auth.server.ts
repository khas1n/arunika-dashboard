import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { username } from 'better-auth/plugins'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { env } from '#/config/env.server'
import { prisma } from '#/lib/db.server'
import { hashPassword, verifyPassword } from '#/lib/password.server'

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  plugins: [username({ displayUsername: false }), tanstackStartCookies()],
})
