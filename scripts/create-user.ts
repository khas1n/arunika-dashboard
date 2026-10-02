import 'dotenv/config'
import { createInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'
import { parseArgs } from 'node:util'
import { PrismaPg } from '@prisma/adapter-pg'
import { z } from 'zod'
import { hashPassword } from '../src/lib/password.server.ts'

import { PrismaClient } from '../src/generated/prisma/client.js'

const usage =
  'Usage: pnpm user:create --username <username> --email <email> [--name <name>] [--password <password>]'

// Usernames are stored lowercase because Better Auth lowercases them before
// the sign-in lookup. The character rules match the login form.
const detailsSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Username needs at least 3 characters.')
    .max(30, 'Username can have at most 30 characters.')
    .regex(
      /^[a-z0-9_]+$/,
      'Username can only use letters, numbers, and underscores.',
    ),
  email: z.string().trim().toLowerCase().pipe(z.email('Email is not valid.')),
  name: z.string().trim().min(1, 'Name cannot be empty.'),
})

const passwordSchema = z
  .string()
  .min(8, 'Password needs at least 8 characters.')
  .max(128, 'Password can have at most 128 characters.')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required')
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
})

async function promptPassword() {
  if (!process.stdin.isTTY) {
    throw new Error(
      'Pass --password, or run this in a terminal to type the password.',
    )
  }

  // readline echoes keystrokes to `output`; a sink keeps the password hidden.
  const rl = createInterface({
    input: process.stdin,
    output: new Writable({ write: (_chunk, _encoding, done) => done() }),
    terminal: true,
  })
  rl.on('SIGINT', () => {
    rl.close()
    process.exit(130)
  })

  try {
    process.stdout.write('Password: ')
    const password = await rl.question('')
    process.stdout.write('\nRepeat password: ')
    const repeated = await rl.question('')
    process.stdout.write('\n')

    if (password !== repeated) {
      throw new Error('Passwords do not match.')
    }

    return password
  } finally {
    rl.close()
  }
}

async function main() {
  const { values } = parseArgs({
    // pnpm forwards a literal `--` when people type `pnpm user:create -- ...`.
    args: process.argv.slice(2).filter((arg) => arg !== '--'),
    options: {
      username: { type: 'string' },
      email: { type: 'string' },
      name: { type: 'string' },
      password: { type: 'string' },
    },
  })

  if (!values.username || !values.email) {
    console.error(usage)
    process.exitCode = 1
    return
  }

  const details = detailsSchema.safeParse({
    username: values.username,
    email: values.email,
    name: values.name ?? values.username,
  })

  if (!details.success) {
    console.error(z.prettifyError(details.error))
    process.exitCode = 1
    return
  }

  const { username, email, name } = details.data

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
    select: { username: true, email: true },
  })

  if (existing) {
    console.error(
      existing.username === username
        ? `Username "${username}" is already taken.`
        : `Email "${email}" already belongs to "${existing.username}".`,
    )
    process.exitCode = 1
    return
  }

  const password = passwordSchema.safeParse(
    values.password ?? (await promptPassword()),
  )

  if (!password.success) {
    console.error(z.prettifyError(password.error))
    process.exitCode = 1
    return
  }

  const userId = crypto.randomUUID()

  await prisma.user.create({
    data: {
      id: userId,
      name,
      email,
      username,
      emailVerified: true,
      accounts: {
        create: {
          id: crypto.randomUUID(),
          accountId: userId,
          providerId: 'credential',
          password: await hashPassword(password.data),
        },
      },
    },
  })

  console.log(`Created "${username}" (${email}). They can sign in now.`)
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
