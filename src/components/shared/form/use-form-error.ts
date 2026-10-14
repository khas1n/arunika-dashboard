import { useState } from 'react'

const FALLBACK = 'Terjadi kesalahan. Coba lagi.'

export function messageFrom(error: unknown) {
  return error instanceof Error ? error.message : FALLBACK
}

export function useFormError() {
  const [message, setMessage] = useState<string>()

  return {
    message,
    clear: () => setMessage(undefined),
    report: (error: unknown) => setMessage(messageFrom(error)),
  }
}
