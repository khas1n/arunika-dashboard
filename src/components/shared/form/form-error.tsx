import type { FC } from 'react'
import { Alert, AlertDescription } from '#/components/ui/alert'

interface FormErrorProps {
  message?: string
}

export const FormError: FC<FormErrorProps> = ({ message }) => {
  if (!message) return null
  return (
    <Alert variant="destructive">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
