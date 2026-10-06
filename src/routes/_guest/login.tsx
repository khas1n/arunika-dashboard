import type { FC } from 'react'
import { createFileRoute, getRouteApi } from '@tanstack/react-router'
import { LoginForm } from '#/features/auth/components/login-form'
import { useSignIn } from '#/features/auth/hooks/use-sign-in'
import { loginSearchSchema } from '#/features/auth/schemas/login'

const routeApi = getRouteApi('/_guest/login')

const LoginPage: FC = () => {
  const { redirect: redirectTo = '/' } = routeApi.useSearch()
  const signIn = useSignIn()

  return <LoginForm onSubmit={(values) => signIn(values, redirectTo)} />
}

export const Route = createFileRoute('/_guest/login')({
  ssr: false,
  validateSearch: loginSearchSchema,
  head: () => ({
    meta: [{ title: 'Masuk | Arunika' }],
  }),
  component: LoginPage,
})
