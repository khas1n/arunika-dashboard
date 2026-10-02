import { z } from 'zod'

export const loginSchema = z.object({
  username: z
    .string()
    .min(3, 'Nama pengguna minimal 3 karakter')
    .max(30, 'Nama pengguna maksimal 30 karakter')
    .regex(
      /^[A-Za-z0-9_]*$/,
      'Nama pengguna hanya huruf, angka, dan garis bawah',
    ),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
  rememberMe: z.boolean(),
})

export type LoginValues = z.infer<typeof loginSchema>

export function isSafeRedirect(value: string) {
  return (
    value.startsWith('/') &&
    !value.startsWith('//') &&
    !value.includes('\\') &&
    !value.includes('://')
  )
}

export const loginSearchSchema = z.object({
  redirect: z
    .string()
    .optional()
    .transform((value) => (value && isSafeRedirect(value) ? value : undefined)),
})
