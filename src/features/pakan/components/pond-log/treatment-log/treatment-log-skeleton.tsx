import type { FC } from 'react'
import { Skeleton } from '#/components/ui/skeleton'

interface TreatmentLogSkeletonProps {
  rows?: number
}

export const TreatmentLogSkeleton: FC<TreatmentLogSkeletonProps> = ({
  rows = 4,
}) => {
  return (
    <div className="grid gap-8" aria-busy aria-label="Memuat treatment">
      <section className="grid gap-1">
        <Skeleton className="mx-3 h-3 w-24" />
        <ul className="grid">
          {Array.from({ length: rows }, (_, index) => (
            <li key={index}>
              <div className="grid grid-cols-[3rem_1.5rem_minmax(0,1fr)] items-center gap-x-3 px-3 py-2.5">
                <Skeleton className="ml-auto h-3 w-8" />
                <Skeleton className="size-6 justify-self-center rounded-full" />
                <div className="flex flex-wrap items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                  <Skeleton className="h-5 w-14 rounded-md" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
