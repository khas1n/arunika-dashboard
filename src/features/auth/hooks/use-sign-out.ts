import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { sessionQueryKey } from '#/features/auth/api/session.queries'

export function useSignOut() {
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()

  return async () => {
    await authClient.signOut()
    queryClient.removeQueries({ queryKey: sessionQueryKey })
    await router.invalidate()
    await navigate({ to: '/login' })
  }
}
