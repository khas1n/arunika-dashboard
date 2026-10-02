import { createFileRoute } from '@tanstack/react-router'
import { LoginForm } from '#/features/auth/components/login-form'
import { useSignIn } from '#/features/auth/hooks/use-sign-in'
import { loginSearchSchema } from '#/features/auth/schemas/login'

export const Route = createFileRoute('/_guest/login')({
  ssr: false,
  validateSearch: loginSearchSchema,
  head: () => ({
    meta: [{ title: 'Masuk | Arunika' }],
  }),
  component: LoginPage,
})

function LoginPage() {
  const { redirect: redirectTo = '/' } = Route.useSearch()
  const signIn = useSignIn()

  return <LoginForm onSubmit={(values) => signIn(values, redirectTo)} />
}
