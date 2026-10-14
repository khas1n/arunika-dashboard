import type { FC } from 'react'
import { useAppForm, FormError, useFormError } from '#/components/shared/form'
import { Button } from '#/components/ui/button'
import { FieldGroup } from '#/components/ui/field'
import { loginSchema } from '#/features/auth/schemas/login'
import type { LoginValues } from '#/features/auth/schemas/login'

interface LoginFormProps {
  onSubmit: (values: LoginValues) => Promise<void>
}

export const LoginForm: FC<LoginFormProps> = ({ onSubmit }) => {
  const formError = useFormError()
  const form = useAppForm({
    defaultValues: {
      username: '',
      password: '',
      rememberMe: false,
    },
    validators: { onSubmit: loginSchema },
    onSubmit: async ({ value }) => {
      formError.clear()
      try {
        await onSubmit(loginSchema.parse(value))
      } catch (error) {
        formError.report(error)
      }
    },
  })

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Masuk</h1>
        <p className="text-sm text-muted-foreground">
          Masuk ke akun Arunika Anda.
        </p>
      </div>

      <FormError message={formError.message} />

      <FieldGroup>
        <form.AppField name="username">
          {(field) => (
            <field.TextField label="Nama pengguna" autoComplete="username" />
          )}
        </form.AppField>
        <form.AppField name="password">
          {(field) => <field.PasswordField label="Kata sandi" />}
        </form.AppField>
        <form.AppField name="rememberMe">
          {(field) => <field.CheckboxField label="Ingat saya" />}
        </form.AppField>
      </FieldGroup>

      <form.Subscribe selector={(state) => state.isSubmitting}>
        {(isSubmitting) => (
          <Button type="submit" loading={isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Masuk'}
          </Button>
        )}
      </form.Subscribe>

      <p className="text-center text-sm text-muted-foreground">
        Lupa kata sandi? Hubungi administrator.
      </p>
    </form>
  )
}
