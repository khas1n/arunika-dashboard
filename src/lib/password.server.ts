import { scryptAsync } from '@noble/hashes/scrypt.js'

// Matches Better Auth's scrypt parameters. @noble/hashes keeps the seed script
// and the Vite dev server on the same implementation.

const cost = {
  N: 16384,
  r: 16,
  p: 1,
  dkLen: 64,
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  )
}

async function deriveKey(password: string, salt: string) {
  return scryptAsync(password.normalize('NFKC'), salt, {
    ...cost,
    maxmem: 128 * cost.N * cost.r * 2,
  })
}

export async function hashPassword(password: string) {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)))
  const key = await deriveKey(password, salt)
  return `${salt}:${toHex(key)}`
}

export async function verifyPassword({
  hash,
  password,
}: {
  hash: string
  password: string
}) {
  const [salt, key] = hash.split(':')
  if (!salt || !key) return false
  const derived = await deriveKey(password, salt)
  return toHex(derived) === key
}
