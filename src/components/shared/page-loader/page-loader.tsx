import type { FC } from 'react'
import { Spinner } from '#/components/ui/spinner'

export const PageLoader: FC = () => {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <Spinner className="size-6" />
    </div>
  )
}
