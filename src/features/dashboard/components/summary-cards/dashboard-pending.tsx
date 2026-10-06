import type { FC } from 'react'
import { Skeleton } from '#/components/ui/skeleton'

export const DashboardPending: FC = () => {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Skeleton className="h-28" />
      <Skeleton className="h-28" />
    </div>
  )
}
