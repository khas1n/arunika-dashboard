import type { FC } from 'react'
import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  defaultPondListQuery,
  kolamPondsQueryOptions,
} from '#/features/pakan/api/kolam.queries'

const EmptyKolam: FC = () => {
  return (
    <section className="grid gap-1">
      <h1 className="text-2xl font-semibold tracking-tight">Kolam</h1>
      <p className="text-sm text-muted-foreground">
        Belum ada data kolam. Jalankan impor BATCH 1.
      </p>
    </section>
  )
}

export const Route = createFileRoute('/_authenticated/kolam/')({
  loader: async ({ context }) => {
    const ponds = await context.queryClient.ensureQueryData(
      kolamPondsQueryOptions(defaultPondListQuery),
    )
    const first = ponds.rows.at(0)
    if (!first) return
    throw redirect({
      to: '/kolam/$pondCode',
      params: { pondCode: first.code },
    })
  },
  component: EmptyKolam,
})
