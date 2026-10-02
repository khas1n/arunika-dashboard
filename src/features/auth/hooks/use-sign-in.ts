import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { authClient } from '#/lib/auth-client'
import { sessionQueryKey } from '#/features/auth/api/session.queries'
import { authErrorMessage } from '#/features/auth/hooks/auth-error'
import type { LoginValues } from '#/features/auth/schemas/login'

export function useSignIn() {
  const navigate = useNavigate()
  const router = useRouter()
  const queryClient = useQueryClient()

  return async (values: LoginValues, redirectTo: string) => {
    const result = await authClient.signIn.username({
      username: values.username,
      password: values.password,
      rememberMe: values.rememberMe,
    })

    if (result.error) {
      throw new Error(authErrorMessage(result.error))
    }

    queryClient.removeQueries({ queryKey: sessionQueryKey })
    await router.invalidate()
    await navigate({ href: redirectTo })
  }
}
