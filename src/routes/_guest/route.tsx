import type { FC } from 'react'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from '#/features/auth/api/session.queries'

const GuestLayout: FC = () => {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Outlet />
        </div>
      </div>
      <div className="hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <p className="text-sm font-medium">Arunika</p>
        <div className="grid gap-2">
          <h2 className="text-3xl font-semibold tracking-tight">
            Dasbor internal
          </h2>
          <p className="max-w-sm text-sm text-primary-foreground/80">
            Masuk untuk melihat ringkasan, profil, dan pengaturan akun.
          </p>
        </div>
      </div>
    </main>
  )
}

export const Route = createFileRoute('/_guest')({
  ssr: 'data-only',
  beforeLoad: async ({ context }) => {
    const session = await context.queryClient.ensureQueryData(
      sessionQueryOptions(),
    )
    if (session) {
      throw redirect({ to: '/' })
    }
  },
  component: GuestLayout,
})
