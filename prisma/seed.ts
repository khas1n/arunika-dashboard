import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { hashPassword } from '../src/lib/password.server.ts'

import { PrismaClient } from '../src/generated/prisma/client.js'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
})

async function main() {
  const name = process.env.SEED_ADMIN_NAME ?? 'Administrator'
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@arunika.local'
  const username = (process.env.SEED_ADMIN_USERNAME ?? 'admin')
    .trim()
    .toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD

  if (!password) {
    throw new Error('SEED_ADMIN_PASSWORD is required')
  }

  const passwordHash = await hashPassword(password)
  const now = new Date()

  const user = await prisma.user.upsert({
    where: { email },
    update: { name, username, updatedAt: now },
    create: {
      id: crypto.randomUUID(),
      name,
      email,
      username,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    },
  })

  const account = await prisma.account.findFirst({
    where: { userId: user.id, providerId: 'credential' },
  })

  if (account) {
    await prisma.account.update({
      where: { id: account.id },
      data: { password: passwordHash, updatedAt: now },
    })
    return
  }

  await prisma.account.create({
    data: {
      id: crypto.randomUUID(),
      accountId: user.id,
      providerId: 'credential',
      userId: user.id,
      password: passwordHash,
      createdAt: now,
      updatedAt: now,
    },
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error: unknown) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
