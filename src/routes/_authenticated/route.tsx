import type { FC } from 'react'
import {
  Outlet,
  createFileRoute,
  getRouteApi,
  redirect,
} from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { AppShell } from '#/components/layout/app-shell'
import { sessionQueryOptions } from '#/features/auth/api/session.queries'
import { useSignOut } from '#/features/auth/hooks/use-sign-out'
import { isSafeRedirect } from '#/features/auth/schemas/login'
import {
  defaultPondListQuery,
  kolamPondsQueryOptions,
} from '#/features/pakan/api/kolam.queries'

const routeApi = getRouteApi('/_authenticated')

const AuthenticatedLayout: FC = () => {
  const { session } = routeApi.useRouteContext()
  const signOut = useSignOut()
  const ponds = useQuery(kolamPondsQueryOptions(defaultPondListQuery))

  return (
    <AppShell
      user={session.user}
      ponds={ponds.data?.rows}
      onSignOut={() => void signOut()}
    >
      <Outlet />
    </AppShell>
  )
}

export const Route = createFileRoute('/_authenticated')({
  ssr: 'data-only',
  beforeLoad: async ({ context, location }) => {
    const session = await context.queryClient.ensureQueryData(
      sessionQueryOptions(),
    )

    if (!session) {
      const redirectTo = `${location.pathname}${location.searchStr}`

      throw redirect({
        to: '/login',
        search: {
          redirect: isSafeRedirect(redirectTo) ? redirectTo : undefined,
        },
      })
    }

    return { session }
  },
  component: AuthenticatedLayout,
})
