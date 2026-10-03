import { useId, useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Alert, AlertDescription } from '#/components/ui/alert'
import { Button } from '#/components/ui/button'
import { Field, FieldError, FieldLabel } from '#/components/ui/field'
import { Input } from '#/components/ui/input'
import { toFieldErrors } from '#/lib/form-errors'
import { feedInputSchema } from '#/features/pakan/schemas/feed'
import type { FeedInput } from '#/features/pakan/schemas/feed'

export function FeedForm({
  defaultName = '',
  submitLabel,
  onSubmit,
  onCancel,
}: {
  defaultName?: string
  submitLabel: string
  onSubmit: (values: FeedInput) => Promise<unknown>
  onCancel?: () => void
}) {
  const inputId = useId()
  const [errorMessage, setErrorMessage] = useState<string>()
  const form = useForm({
    defaultValues: { name: defaultName },
    validators: { onSubmit: feedInputSchema },
    onSubmit: async ({ value, formApi }) => {
      setErrorMessage(undefined)
      try {
        await onSubmit(feedInputSchema.parse(value))
        formApi.reset()
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan. Coba lagi.',
        )
      }
    },
  })

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        void form.handleSubmit()
      }}
    >
      {errorMessage ? (
        <Alert variant="destructive">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      ) : null}

      <form.Field name="name">
        {(field) => {
          const invalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={invalid || undefined}>
              <FieldLabel htmlFor={inputId}>Nama jenis pakan</FieldLabel>
              <Input
                id={inputId}
                name={field.name}
                autoComplete="off"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                aria-invalid={invalid || undefined}
              />
              <FieldError errors={toFieldErrors(field.state.meta.errors)} />
            </Field>
          )
        }}
      </form.Field>

      <div className="flex gap-2">
        <form.Subscribe selector={(state) => state.isSubmitting}>
          {(isSubmitting) => (
            <Button type="submit" size="sm" loading={isSubmitting}>
              {submitLabel}
            </Button>
          )}
        </form.Subscribe>
        {onCancel ? (
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            Batal
          </Button>
        ) : null}
      </div>
    </form>
  )
}
