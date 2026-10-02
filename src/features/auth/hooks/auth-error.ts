const messages: Record<string, string> = {
  INVALID_USERNAME_OR_PASSWORD: 'Nama pengguna atau kata sandi salah.',
  INVALID_USERNAME: 'Nama pengguna tidak valid.',
  USERNAME_TOO_SHORT: 'Nama pengguna minimal 3 karakter.',
  USERNAME_TOO_LONG: 'Nama pengguna maksimal 30 karakter.',
  USER_NOT_FOUND: 'Nama pengguna atau kata sandi salah.',
  TOO_MANY_REQUESTS: 'Terlalu banyak percobaan. Coba lagi nanti.',
}

export function authErrorMessage(error: {
  code?: string | undefined
  message?: string | undefined
}) {
  if (error.code && messages[error.code]) {
    return messages[error.code]
  }

  return 'Terjadi kesalahan. Coba lagi.'
}
