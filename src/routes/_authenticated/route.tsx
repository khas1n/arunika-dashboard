import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { AppShell } from '#/components/layout/app-shell'
import { sessionQueryOptions } from '#/features/auth/api/session.queries'
import { useSignOut } from '#/features/auth/hooks/use-sign-out'
import { isSafeRedirect } from '#/features/auth/schemas/login'

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

function AuthenticatedLayout() {
  const { session } = Route.useRouteContext()
  const signOut = useSignOut()

  return (
    <AppShell user={session.user} onSignOut={() => void signOut()}>
      <Outlet />
    </AppShell>
  )
}
